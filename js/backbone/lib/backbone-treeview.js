// A file tree view javascript class
//     Accepts formatted JSON:
//     Root Node ->
//     {
//         path: "path",
//         name: "name",
//         nodes: [ array of nodes ]
//     }

window.Filetree = function(spec, my) {

    var Node = Backbone.Model.extend({
        defaults: {    
            type: "File", 
            path: "/",  
            extension: "",
            selected: false
        },
        initialize: function(attributes, options) {
            var nodes = null;
            if (this.has('nodes')) {
                nodes = this.get('nodes');
                this.unset('nodes');
            }
            if (nodes) {
                var nodeList = new NodeList(nodes);
                this.set('nodes', nodeList);
            }            
        }
    });

    var NodeList = Backbone.Collection.extend({
        model: Node,
        comparator: function(node) {
            return node.get('path');
        }
    });

    var NodeView = Backbone.View.extend({
        tagName: 'li',
        navIconTemplate: '<div class="backbone-tree-nav-icon"></div>',
        iconTemplate: '<div class="backbone-tree-icon{{ext}}"></div>',
        extensionTemplate: '<div class="{{ext}}"></div>',
        labelTemplate: '<div class="backbone-tree-label">{{name}}</div>',
        events: {
            'click .backbone-tree-nav-icon': 'toggle',
            'mouseover .backbone-tree-label': 'labelHoverOn',
            'mouseout .backbone-tree-label': 'labelHoverOff',
            'click .backbone-tree-label': 'labelClick',            
            'contextmenu .backbone-tree-label': 'handleRightClick',
        },
        initialize: function(args) {
            this.vent = args.vent;
            var type = this.model.get('type');
            if (type === 'Directory') {
                //TODO: can add code here for open/close state as parameter
                this.className = 'backbone-tree-expandable ';
                this.$el.attr('class', this.className);                
                if(this.model.has('nodes')) {
                    this.nodeListView = new NodeListView({
                        collection: this.model.get('nodes'),
                        parent: this,
                        vent: args.vent
                    });
                    this.vent = args.vent;
                    this.vent.on('toggleDefaultPath', this.toggleDefaultPath, this);
                }                 
            }
            else {
                this.className = 'backbone-tree-leaf';
                this.$el.attr('class', this.className);
                                
            }
            var indexOfThisModel = this.model.collection.indexOf(this.model);
            if (indexOfThisModel == 0 && indexOfThisModel == this.model.collection.length - 1) {
                this.$el.addClass('backbone-tree-single');
            }
            else if (indexOfThisModel == 0) {
                this.$el.addClass('backbone-tree-first');
            }
            else if (indexOfThisModel == this.model.collection.length - 1) {
                this.$el.addClass('backbone-tree-last');
            }

        },
        render: function() {
            var navIconHtml = Handlebars.compile(this.navIconTemplate);
            var iconHtml = Handlebars.compile(this.iconTemplate);
            var extensionHtml = Handlebars.compile(this.extensionTemplate);
            var labelHtml = Handlebars.compile(this.labelTemplate);
            var context = {name: this.model.get('name')};

            var ext = "";
            if(this.model.get('type') == 'File') {
                ext = {ext: " ext_" + this.model.get('extension')};
                console.log("ext: " + ext);
            }
            this.$el.append(navIconHtml)
                .append(iconHtml(ext))
                .append(labelHtml(context));
            if (this.nodeListView) {
                this.$el.append(this.nodeListView.render().el);
            }

            if (this.model.has('iconClass')) {
                this.$('.backbone-tree-icon').addClass(this.model.get('iconClass'));
            }

            return this;
        },
        toggle: function(event) {
            event.stopPropagation();            
            if (!this.$el.hasClass('backbone-tree-leaf')) {
                if (this.$el.hasClass('backbone-tree-collapsible')) {
                    this.$el.removeClass('backbone-tree-collapsible')
                        .addClass('backbone-tree-expandable');                    
                    if(this.model.has('nodes')) {
                        var rootView = this.findRootView(this);
                        rootView.handleClickToggle(this);
                    }
                }                
                else {
                    this.$el.removeClass('backbone-tree-expandable')
                        .addClass('backbone-tree-collapsible');
                    if(!this.model.has('nodes')) {
                        //try to ajax load the new nodes
                        //http://localhost:8080/prepare/file/index?dir=/ZED/PIVOTS/
                        var nodeList = null;
                        var rootView = this.findRootView(this);
                        if(rootView.url && rootView.root) {
                            jQuery.ajax({
                                url:rootView.url,
                                data: { dir: this.model.get('path'), root: false },
                                async:false,
                                success: function(data) {
                                    if(data.constructor === String){
                                        data = JSON.parse(data);
                                    }
                                    nodeList = new NodeList(data); 
                                }
                            });
                        }                        
                        if(nodeList) {
                            this.model.set('nodes', nodeList);
                            this.nodeListView = new NodeListView({
                                collection: this.model.get('nodes'),
                                parent: this
                            });
                            this.$el.append(this.nodeListView.render().el);
                        }                        
                    }
                }
            }

        },
        toggleDefaultPath:function(args){
            var rootView = args.rootView;
            for (var key in rootView.nodeListView.nodeViews) {
                var nodeview = rootView.nodeListView.nodeViews[key];
                var index = args.defaultPath.indexOf(nodeview.model.get('path'));
                if(index != -1) {
                    nodeview.$el.children('.backbone-tree-nav-icon').click();
                    this.vent.trigger("toggleDefaultPath", {rootView: nodeview, defaultPath: args.defaultPath});
                }                
            }            
        },        
        findRootView: function(nodeView){
            var rootView = nodeView;
            while (rootView.parent) {
                rootView = rootView.parent;
            }
            return rootView;
        },
        labelHoverOn: function(event) {
            event.stopPropagation();
            this.$el.children('.backbone-tree-label')
                .addClass('backbone-tree-hovered');
        },
        labelHoverOff: function(event) {
            event.stopPropagation();
            this.$el.children('.backbone-tree-label')
                .removeClass('backbone-tree-hovered');
        },
        labelClick: function(event) {
            event.stopPropagation();
            var rootView = this.findRootView(this);
            if(rootView.fileOnly == true && this.model.get('type') !== 'File') {
                return false;
            }
            this.model.set('selected', true, {silent: true});            
            var ctrlKey = false;
            console.log("multiSelect: " + rootView.multiSelect);
            if(event.ctrlKey && rootView.multiSelect) {
                ctrlKey = true;                
            }            
            rootView.handleClickNode(this, ctrlKey);    
            this.$el.trigger("blkui-tree-leftclick", this.model.attributes);
        },
        setParent: function(parent) {
            this.parent = parent;
        },
        setSelectHighlight: function() {
            this.$el.children('.backbone-tree-label')
                .addClass('backbone-tree-selected');
        },
        unsetSelectHighlight: function() {
            this.$el.children('.backbone-tree-label')
                .removeClass('backbone-tree-selected');
        },
        handleRightClick: function(e) {
            e.stopPropagation();
            this.$el.trigger("blkui-tree-rightclick", 
                [this.model.attributes, {pageX: e.pageX, pageY: e.pageY}]
            );
            return false;
        },        
        isLeaf: function() {
            return (!this.model.has('nodes'));
        },
        getAttributes: function() {
            return this.model.attributes;
        }
    });

    var NodeListView = Backbone.View.extend({
        tagName: 'ul',
        initialize: function(args) {            
            _.bindAll(this, 'createNodeView', 'renderNode');
            this.vent = args.vent;
            this.parent = args.parent;
            this.defaultPath = args.defaultPath            
            this.nodeViews = {};
            this.collection.each(this.createNodeView);
        },
        render: function() {
            this.collection.each(this.renderNode);
            return this;
        },
        renderNode: function(node) {
            this.$el.append(this.nodeViews[node.cid].render().el);
        },
        createNodeView: function(node) {
            var nodeView = new NodeView({model: node, vent: this.vent});
            nodeView.setParent(this.parent);            
            this.nodeViews[node.cid] = nodeView;

        }
    });

    var TreeView = Backbone.View.extend({
        events: {
            'click #printSelected': 'printSelected'
        },
        className: 'backbone-tree',
        initialize: function(args) {
            this.vent = vent;
            var nodeList = null;        
            if(args.url && args.root) {
                this.url = args.url;
                this.root = args.root;
                jQuery.ajax({
                    url:args.url,
                    data: { dir: args.root, root: true },
                    async:false,
                    success: function(data) {
                        if(data.constructor === String){
                            data = JSON.parse(data);
                        }
                        nodeList = new NodeList(data); 
                    }
                });
            } else {
                nodeList = new NodeList(args.nodes);
            }
            if(args.defaultPath) {
                this.defaultPath = args.defaultPath;
            }
            this.nodeListView = new NodeListView({
                collection: nodeList,
                parent: this,
                vent: vent
            });            
            this.className += 
                (args.theme) ? ' ' + args.theme : ' backbone-tree-default';
            this.$el.attr('class', this.className);
            this.inputName = args.inputName;
            this.multiSelect = args.multiSelect;
            this.fileOnly = args.fileOnly;
            this.selected = [];                        
        },
        render: function() {
            //if it is modal, we need to append stuff here...

            this.$el.append(this.nodeListView.render().el);
            if(this.modal) {
                this.$el.append('<button id="printSelected" class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>');    
                this.$el.append('<button id="printSelected" data-dismiss="modal" class="btn btn-primary">Open</button>');
            } else {
                this.$el.append('<button id="printSelected" class="btn btn-primary">Open</button>');
            }   
            if(this.defaultPath) {
                this.vent.trigger("toggleDefaultPath", {rootView: this, defaultPath: this.defaultPath});
            }
            return this;
        },
        handleClickNode: function(nodeView, multiple) {
            if (this.selected.length && !multiple) {
                for (var i = 0; i < this.selected.length; i++) {
                    this.selected[i].unsetSelectHighlight();
                }
                this.selected = [];
            }            
            var index = this.selected.push(nodeView);
            this.selected[index-1].setSelectHighlight();
        },
        handleClickToggle: function(node) {            
            //unselect all children on collide
            if (this.selected.length) {
                var cleaned = [];
                for (var i = 0; i < this.selected.length; i++) {
                    var index = this.selected[i].model.get("path").indexOf(node.model.get("path"));
                    if(index != -1) {
                        this.selected[i].unsetSelectHighlight();
                    } else {
                        cleaned.push(this.selected[i]);
                    }
                }
                this.selected = cleaned;
            }
        },
        printSelected:function() {
            console.log("Open btn clicked!");
            $("[name^='"+this.inputName+"']").remove();
            for (var i = 0; i < this.selected.length; i++) {
                console.log("item: " + this.selected[i].model.get('path'));
                var path = this.selected[i].model.get('path');
                var fileInput = Handlebars.compile('<input type="hidden" name="{{this.inputName}}[]" value="{{path}}" />');                
                this.$el.append(fileInput({inputName: this.inputName, path: path}));
            }
        },
    });

    
    var vent = _.extend({}, Backbone.Events);

    var treeView = new TreeView({
        vent: vent,
        el: spec.el,
        inputName: spec.inputName,
        nodes: spec.nodes,
        theme: spec.theme,
        modal: spec.modal,
        multiSelect: spec.multiSelect,
        fileOnly: spec.fileOnly,
        url: spec.url,
        root: spec.root,
        defaultPath: spec.defaultPath
    });

    if (spec.autoRender) {
        treeView.render();      
    }

    return treeView; 

};

