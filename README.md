Backbone.js filetree widget
==================================

This is a configurable backbone fileTree widget. It can load a file tree structure like 

## OPTIONS

	url: "..." #the ajax url to call in order to get the path
	root: "..." #the root folder of the ajax call
	defaultPath: '...' #the default path that the tree must collapse
	el: "fileTree" #the element where to load the file tree
	callback: #a function callback that get the list of path's when they are choosed
	modal: <true, false> #add the option to close bootstrap windows on «choose»
	autoRender: <true, false> #to render or not the file tree automatically
	inputName: "..." #input name to append. i.e. <input type="hidden" name="<inputName>[]" ... />
	multiSelect: <true, false> #Whether or not to allow the selection of multiple files (ctrl + click)
	fileOnly: <true, false> #whether of not to allow the selection of file only

## EXAMPLE

		var callback = function(paths) {
			console.log("calling callback: " + paths.length);
		};
		
		var demoTree = new Filetree({
			url:'http://localhost/demo/file/',
			root:'/HOME/SEB/',
			defaultPath: '/HOME/SEB//EXTRA',
			el: 'fileTree',
			callback: callback,
			inputName: "files",
			fileOnly: false,
			multiSelect: true,
			modal: false,
			autoRender: true
		});


## DEMO 
http://jsbin.com/aruqec/4/

## CREDITS
Based on Michael Hwang backbone file tree: https://github.com/terranmoccasin/backbone-filetree
