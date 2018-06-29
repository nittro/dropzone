_context.invoke('Nittro.Extras.DropZone', function(Form, Vendor, DOM, Arrays, Strings) {

    var anonId = 0,
        zones = [],
        state = null;

    function register(zone) {
        if (zones.indexOf(zone) < 0) {
            zones.push(zone);
        }

        if (zones.length === 1) {
            DOM.addListener(document, 'dragenter', handleDragEnter);
            DOM.addListener(document, 'dragover', handleDragOver);
            DOM.addListener(document, 'dragleave', handleDragLeave);
            DOM.addListener(document, 'drop', handleDrop);
        }
    }

    function unregister(zone) {
        var i = zones.indexOf(zone);

        if (i > -1) {
            zones.splice(i, 1);
        }

        if (!zones.length) {
            DOM.removeListener(document, 'dragenter', handleDragEnter);
            DOM.removeListener(document, 'dragover', handleDragOver);
            DOM.removeListener(document, 'dragleave', handleDragLeave);
            DOM.removeListener(document, 'drop', handleDrop);
        }
    }

    function findValidZones(evt) {
        if (!evt.dataTransfer.items) {
            return zones;
        }

        var items = evt.dataTransfer.items,
            types = [],
            i, n = items.length;

        for (i = 0; i < n; i++) {
            if (items[i].kind === 'file') {
                if (items[i].type === 'application/x-moz-file') {
                    return zones; // damn firefox
                } else if (types.indexOf(items[i].type) < 0) {
                    types.push(items[i].type);
                }
            }
        }

        return !types.length ? zones : zones.filter(function (zone) {
            return zone.hasAllowedType(types);
        });
    }

    function findTargetZones(zones, target) {
        return zones.filter(function (zone) {
            return zone.hasTarget(target);
        });
    }

    function handleDrop(evt) {
        if (evt.defaultPrevented) {
            state = null;
            return;
        }

        evt.preventDefault();
        state = null;

        zones.forEach(function(zone) {
            var target = zone.getTarget(evt.target),
                e;

            if (target) {
                e = zone.trigger('drop', {
                    files: evt.dataTransfer.files,
                    target: target
                });

                if (!e.isDefaultPrevented()) {
                    zone.addFiles(evt.dataTransfer.files);
                }
            }
        });
    }

    function handleDragEnter(evt) {
        evt.preventDefault();

        var s = getState(evt),
            n = s.path.length,
            elem, i, j, p;

        if (!n) {
            trigger(s.validZones, 'body-enter');
        }

        for (i = 0; i < n; i++) {
            if (evt.target === s.path[i] || DOM.contains(s.path[i], evt.target)) {
                break;
            }
        }

        if (i > 0) {
            for (j = 0; j < i; j++) {
                trigger(findTargetZones(s.validZones, s.path[j]), 'zone-leave', {
                    target: s.path[j]
                });
            }

            s.path.splice(0, i);
        }

        if (s.path[0] !== evt.target) {
            elem = evt.target;
            p = [elem];
            i = 0;

            for (; elem.parentNode && elem.parentNode !== s.path[0]; i++) {
                p.push(elem = elem.parentNode);
            }

            for (; i >= 0; i--) {
                trigger(findTargetZones(s.validZones, p[i]), 'zone-enter', {
                    target: p[i]
                });
            }

            p.unshift(0, 0);
            s.path.splice.apply(s.path, p);
        }
    }

    function handleDragLeave(evt) {
        evt.preventDefault();

        if (evt.target === document.body || evt.target === document.documentElement) {
            leaveAll(getState(evt));
        }
    }

    function handleDragOver(evt) {
        evt.preventDefault();

        if (state) {
            state.tmr && window.clearTimeout(state.tmr);
            state.tmr = window.setTimeout(handleDragOverTimeout, 250);
        }
    }

    function handleDragOverTimeout() {
        if (state) {
            state.tmr && window.clearTimeout(state.tmr);
            leaveAll(state);
        }
    }

    function leaveAll(s) {
        var n = s.path.length,
            i;

        for (i = 0; i < n; i++) {
            trigger(findTargetZones(s.validZones, s.path[i]), 'zone-leave', {
                target: s.path[i]
            });
        }

        trigger(s.validZones, 'body-leave');
        state = null;
    }

    function getState(evt) {
        return state || (state = {
            path: [],
            validZones: findValidZones(evt),
            tmr: null
        });
    }

    function trigger(zones, evt, data) {
        zones.forEach(function(zone) {
            zone.trigger(evt, data);
        });
    }



    var DropZone = _context.extend('Nittro.Object', function(form, elem, options) {
        DropZone.Super.call(this);

        this._.form = form || null;
        this._.elems = [];
        this._.rules = null;
        this._.files = [];
        this._.options = Arrays.mergeTree({}, DropZone.defaults, options);

        this._.allow = {
            types: null,
            extensions: null
        };

        this.validate = this.validate.bind(this);
        this.reset = this.reset.bind(this);
        this._serialize = this._serialize.bind(this);
        this._handleFieldChange = this._handleFieldChange.bind(this);

        if (this._.form) {
            this._.form.on('validate', this.validate);
            this._.form.on('serialize', this._serialize);
            this._.form.on('reset', this.reset);

            this.on('error:default', function(evt) {
                this._.form.trigger('error', {
                    element: this._getField() || this.getElement(),
                    message: evt.data.message
                });
            }.bind(this));
        }

        if (this._.options.allowedTypes) {
            this.setAllowedTypes(this._.options.allowedTypes);
        }

        if (this._.options.maxSize) {
            this._.options.maxSize = this._normalizeMaxSize(this._.options.maxSize);
        }

        if (this._.options.field) {
            this._.rules = DOM.getData(this._.options.field, 'nette-rules');
            this._.options.fieldName = this._.options.field.name;
            this._.options.required = this._.options.field.required;
            this._.options.multiple = this._.options.field.multiple;

            if (this._.options.field.accept) {
                this.setAllowedTypes(this._.options.field.accept);
            } else if (this._.options.allowedTypes) {
                this._.options.field.accept = this._formatAccept(this._.options.allowedTypes);
            }

            this._.options.field.required = false;
            this._.options.field.removeAttribute('data-nette-rules');

            if (!this._.options.field.hasAttribute('id')) {
                this._.options.field.setAttribute('id', 'dropzone-field' + (++anonId));
            }

            this._.options.field = this._.options.field.getAttribute('id');

            DOM.addListener(document, 'change', this._handleFieldChange);
        }

        if (elem) {
            this.attach(elem);
        }
    }, {
        STATIC: {
            create: function(formLocator, from) {
                if (!(from instanceof HTMLInputElement) || from.type !== 'file') {
                    throw new Error('Invalid argument, must be a file input');
                }

                var form = from.form ? formLocator.getForm(from.form) : null;

                return new DropZone(form, null, {
                    field: from
                });
            },

            TYPES: {

            },

            defaults: {
                field: null,
                fieldName: null,
                required: false,
                allowedTypes: null,
                maxSize: null,
                multiple: true,
                netteValidate: {
                    perFile: true,
                    onSubmit: true
                },

                messages: {
                    empty: 'This field is required.',
                    invalidType: 'File %s isn\'t an allowed kind of file',
                    exceededSize: 'File %s is too large.'
                }
            }
        },

        attach: function(elem) {
            this._.elems.push(elem);
            register(this);
            return this;
        },

        detach: function() {
            this._.elems = [];
            unregister(this);
            return this;
        },

        isAttached: function () {
            return this._.elems.length > 0;
        },

        getElement: function () {
            return this._.elems.length ? this._.elems[0] : null;
        },

        getElements: function() {
            return this._.elems;
        },

        setAllowedTypes: function(allowedTypes) {
            this._.options.allowedTypes = allowedTypes ? this._normalizeTypes(allowedTypes) : null;

            var types = [],
                extensions = [],
                t, i, n = this._.options.allowedTypes.length;

            for (i = 0; i < n; i++) {
                t = this._.options.allowedTypes[i];

                if (t.charAt(0) === '.') {
                    extensions.push(Strings.escapeRegex(t.substr(1)));
                } else {
                    types.push(Strings.escapeRegex(t).replace(/\/\\\*$/, '/.+'));
                }
            }

            this._.allow.types = types.length ? new RegExp('^(' + types.join('|') + ')$', 'i') : null;
            this._.allow.extensions = extensions.length ? new RegExp('\\.(' + extensions.join('|') + ')$', 'i') : null;
            return this;
        },

        setMaxSize: function(size) {
            this._.options.maxSize = size ? this._normalizeMaxSize(size) : null;
            return this;
        },

        setRequired: function(required) {
            this._.options.required = required !== false;
            return this;
        },

        setMultiple: function(multiple) {
            this._.options.multiple = multiple !== false;
            return this;
        },

        setFieldName: function(fieldName) {
            this._.options.fieldName = fieldName;
            return this;
        },

        hasFiles: function() {
            return this._.files.length > 0;
        },

        getFiles: function() {
            return this._.files.slice();
        },

        getFile: function(index) {
            return this._.files[index] || null;
        },

        isImage: function(file) {
            return /^image\/.+$/i.test(file.type);
        },

        loadImages: function() {
            var queue = [];

            this._.files.forEach(function(file) {
                if (file.type.match(/^image\/.+$/i)) {
                    queue.push(this.loadImage(file));
                }
            }.bind(this));

            return Promise.all(queue);
        },

        loadImage: function(file) {
            return new Promise(function(fulfill, reject) {
                var reader = new FileReader(),
                    image = new Image();

                reader.onload = function() {
                    image.src = reader.result;
                    fulfill(image);
                };

                reader.onerror = function() {
                    reject();
                };

                reader.readAsDataURL(file);
            });
        },

        addFiles: function(files) {
            var i = 0,
                n = this._.options.multiple ? files.length : 1;

            if (!this._.options.multiple) {
                this._.files = [];
            }

            for (; i < n; i++) {
                this.addFile(files instanceof FileList ? files.item(i) : files[i]);
            }

            this.trigger('files-added');

            return this;
        },

        addFile: function (file) {
            try {
                this._validateFile(file);

                var evt = this.trigger('file', {
                    file: file,
                    index: this._.files.length
                });

                if (!evt.isDefaultPrevented()) {
                    this._.files.push(file);
                }
            } catch (e) {
                if (e instanceof ValidationError) {
                    this.trigger('error', {
                        message: e.message,
                        file: file
                    });
                } else if (!(e instanceof NetteValidationError)) {
                    throw e;
                }
            }

            return this;
        },

        removeFile: function(file) {
            if (typeof file !== 'number') {
                file = this._.files.indexOf(file);
            }

            if (file >= 0 && file < this._.files.length) {
                this._.files.splice(file, 1);
            }

            return this;

        },

        reset: function() {
            this._.files = [];
            return this;
        },

        destroy: function() {
            this.trigger('destroy');

            this.detach();
            this.off();
            this._.files = [];

            if (this._.form) {
                this._.form.off('validate', this.validate);
                this._.form.off('serialize', this._serialize);
                this._.form.off('reset', this.reset);
            }

            this._.form = null;

            if (this._hasField()) {
                DOM.removeListener(document, 'change', this._handleFieldChange);
            }
        },

        validate: function(evt) {
            if (this._.options.netteValidate.onSubmit && this._hasField() && this._.rules && !Vendor.validateControl(this._getField(), this._.rules, false, { value: this._.files })) {
                evt.preventDefault();
            } else if (this._.options.required && !this._.files.length) {
                evt.preventDefault();
                this.trigger('error', { message: this._formatErrorMessage('empty') });
            }
        },

        formatSize: function(bytes) {
            var units = ['kB', 'MB', 'GB', 'TB'],
                unit = 'B';

            while (bytes > 1024 && units.length) {
                unit = units.shift();
                bytes /= 1024;
            }

            return (unit === 'B' ? bytes : bytes.toFixed(2)) + ' ' + unit;
        },

        hasTarget: function (elem) {
            return this._.elems.indexOf(elem) > -1;
        },

        getTarget: function (elem) {
            for (var i = 0, n = this._.elems.length; i < n; i++) {
                if (this._.elems[i] === elem || DOM.contains(this._.elems[i], elem)) {
                    return this._.elems[i];
                }
            }

            return null;
        },

        hasAllowedType: function (types) {
            return !this._.allow.types || types.some(function(type) {
                return this._.allow.types.test(type);
            }.bind(this));
        },

        _hasField: function () {
            return !!this._.options.field;
        },

        _getField: function () {
            return this._.options.field ? DOM.getById(this._.options.field) : null;
        },

        _validateFile: function(file, onlyCheck) {
            if (this._.options.netteValidate.perFile && this._hasField() && this._.rules && !Vendor.validateControl(this._getField(), this._.rules, onlyCheck === true, { value: [file] })) {
                throw new NetteValidationError();
            } else if (!this._validateType(file.name, file.type)) {
                throw new ValidationError(this._formatErrorMessage('invalidType', [file.name, file.type]));
            } else if (!this._validateSize(file.size)) {
                throw new ValidationError(this._formatErrorMessage('exceededSize', [file.name, this.formatSize(file.size), this.formatSize(this._.options.maxSize)]));
            }
        },

        _validateType: function(name, type) {
            return !(
                this._.allow.types && type && !this._.allow.types.test(type)
                || this._.allow.extensions && name && !this._.allow.extensions.test(name)
            );
        },

        _validateSize: function(size) {
            return !this._.options.maxSize || size <= this._.options.maxSize;
        },

        _handleFieldChange: function(evt) {
            if (this._hasField() && evt.target === this._getField()) {
                if (evt.target.files.length) {
                    this.addFiles(evt.target.files);

                    if (this._.form) {
                        this._.form.setValue(this._.options.fieldName, null);
                    } else {
                        var html = evt.target.parentNode.innerHTML;
                        DOM.html(evt.target.parentNode, html);
                    }
                }
            }
        },

        _serialize: function(evt) {
            for (var i = 0; i < this._.files.length; i++) {
                evt.data.append(this._.options.fieldName, this._.files[i]);
            }
        },

        _formatAccept: function(allowedTypes) {
            return allowedTypes.join(',');
        },

        _normalizeTypes: function(allowedTypes) {
            if (typeof allowedTypes === 'string') {
                return allowedTypes.trim().split(/\s*,\s*/g);
            }

            return allowedTypes;
        },

        _normalizeMaxSize: function(size) {
            if (typeof size === 'string') {
                var unit;

                if (unit = size.match(/(k|M|G|T)?B$/)) {
                    unit = unit[1];
                    size = size.replace(/(k|M|G|T)?B$/, '');
                } else {
                    unit = 'B';
                }

                size = parseFloat(size.trim());

                switch (unit) {
                    case 'T': size *= 1024;
                    case 'G': size *= 1024;
                    case 'M': size *= 1024;
                    case 'k': size *= 1024;
                }
            }

            return size;
        },

        _formatErrorMessage: function(type, params) {
            var message = this._.options.messages[type];

            if (params) {
                message = Strings.vsprintf(message, params);
            }

            return message;
        }
    });

    var ValidationError = _context.extend(function(message) {
        this.message = message;
    });

    var NetteValidationError = _context.extend(function() {

    });

    _context.register(DropZone, 'DropZone');

}, {
    Form: 'Nittro.Forms.Form',
    Vendor: 'Nittro.Forms.Vendor',
    Arrays: 'Utils.Arrays',
    Strings: 'Utils.Strings',
    DOM: 'Utils.DOM'
});
