_context.invoke('Nittro.Extras.DropZone.Bridges.DropZoneDI', function() {

    var DropZoneExtension = _context.extend('Nittro.DI.BuilderExtension', function(containerBuilder, config) {
        DropZoneExtension.Super.call(this, containerBuilder, config);
    }, {
        load: function() {
            this._getContainerBuilder().addFactory('dropZone', 'Nittro.Extras.DropZone.DropZone::create()');
        }
    });

    _context.register(DropZoneExtension, 'DropZoneExtension')

});
