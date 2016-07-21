_context.invoke('Nittro.Extras.DropZone.Bridges', function(Nittro) {

    if (!Nittro.DI) {
        return;
    }

    var DropZoneDI = _context.extend('Nittro.DI.BuilderExtension', function(containerBuilder, config) {
        DropZoneDI.Super.call(containerBuilder, config);
    }, {
        load: function() {
            this._getContainerBuilder().addFactory('dropZone', 'Nittro.Extras.DropZone.DropZone::create()');
        }
    });

    _context.register(DropZoneDI, 'DropZoneDI')

});
