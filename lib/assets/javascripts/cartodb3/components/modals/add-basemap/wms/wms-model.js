var Backbone = require('backbone');
var _ = require('underscore');
var WMSView = require('./wms-view');
var WMSLayersCollection = require('./wms-layers-collection');
var WMSService = require('../../../../data/wms-service');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    currentView: 'enterURL', // [fetchingLayers, selectLayer, savingLayer]
    layersFetched: false,
    layer: undefined // will be set when selected
  },

  initialize: function (attrs, opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;

    this.wmsLayersCollection = null;
  },

  createView: function () {
    this.set({
      currentView: 'enterURL',
      layersFetched: false
    });

    return new WMSView({
      model: this,
      customBaselayersCollection: this._customBaselayersCollection
    });
  },

  fetchLayers: function (url) {
    var self = this;

    this.set('currentView', 'fetchingLayers');

    var wmsService = new WMSService(url);

    this.wmsLayersCollection = new WMSLayersCollection(null, {
      wmsService: wmsService
    });
    this.wmsLayersCollection.bind('change:state', this._onLayerStateChange, this);
    this.wmsLayersCollection.bind('change:selected', this._onLayerSelectedChange, this);
    this.wmsLayersCollection.bind('reset', function () {
      this.trigger('layersFetched');
    }, this);

    this.wmsLayersCollection.fetch({
      complete: function () {
        self.set({
          currentView: self.wmsLayersCollection.length > 0 ? 'selectLayer' : 'enterURL',
          layersFetched: true
        });
      },
      reset: true
    });
  },

  layersAvailableCount: function () {
    return _.difference(
      this.wmsLayersCollection.pluck('title'),
      this._customBaselayersCollection.pluck('name')
    ).length;
  },

  get: function (name) {
    if (name === 'layer') {
      return this.wmsLayersCollection
        .find(function (mdl) {
          return mdl.get('state') === 'saveDone';
        })
        .get('customBaselayerModel');
    } else {
      return Backbone.Model.prototype.get.apply(this, arguments);
    }
  },

  getLayers: function () {
    if (this.get('searchQuery')) {
      var regExp = new RegExp(this.get('searchQuery'), 'i');

      return this.wmsLayersCollection.filter(function (layer) {
        return layer.get('name').match(regExp);
      }, this);
    } else {
      return this.wmsLayersCollection;
    }
  },

  hasAlreadyAddedLayer: function () {
    // Already added layers are disabled to be saved for each layer
    return false;
  },

  _onLayerStateChange: function (mdl, newState) {
    switch (newState) {
      case 'saving':
        this.set('currentView', 'savingLayer');
        break;
      case 'saveDone':
        this.set('layer', mdl.get('customBaselayerModel'));
        this.trigger('saveBasemap');
        break;
      case 'saveFail':
        this.set('currentView', 'saveFail');
        break;
      default:
        this.set('currentView', 'selectLayer');
    }
  },

  _onLayerSelectedChange: function (mdl, isSelected) {
    if (isSelected) {
      mdl.createProxiedLayerOrCustomBaselayerModel();
    }
  }

});