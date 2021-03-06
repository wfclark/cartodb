var Backbone = require('backbone');
var WidgetsFormColumnOptionsFactory = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/widgets-form-column-options-factory');
var WidgetsFormCategorySchemaModel = require('../../../../../../../javascripts/cartodb3/editor/widgets/widgets-form/schema/widgets-form-category-schema-model');

describe('editor/widgets/widgets-form/schema/widgets-form-category-schema-model', function () {
  beforeEach(function () {
    var querySchemaModel = new Backbone.Model();
    this.widgetsFormColumnOptionsFactory = new WidgetsFormColumnOptionsFactory(querySchemaModel);
    spyOn(this.widgetsFormColumnOptionsFactory, 'create').and.returnValue([{
      val: 'col',
      label: 'col'
    }]);
    spyOn(this.widgetsFormColumnOptionsFactory, 'unavailableColumnsHelpMessage');

    this.model = new WidgetsFormCategorySchemaModel({
      type: 'category',
      layer_id: 'l-1',
      column: 'col',
      aggregation: 'count'
    }, {
      columnOptionsFactory: this.widgetsFormColumnOptionsFactory
    });
  });

  describe('.updateSchema', function () {
    beforeEach(function () {
      this.model.updateSchema();
    });

    it('should contain the real columns as options', function () {
      expect(this.model.schema.column.options[0].label).toEqual('col');
    });

    it('should not contain aggregation column if the aggregation is "count"', function () {
      expect(this.model.schema.aggregation_column).not.toBeDefined();

      this.model.set({aggregation: 'avg'});
      expect(this.model.schema.aggregation_column).toBeDefined();
    });
  });
});
