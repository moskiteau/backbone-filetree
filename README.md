Backbone.js filetree widget
==================================

This is a configurable backbone fileTree widget. It can load a file tree structure like 

## OPTIONS

	url: "..." #the ajax url to call in order to get the path
	root: "..." #the root folder of the ajax call
	defaultPath: '...' #the default path that the tree must collapse
	el: "fileTree" #the element where to load the file tree
	modal: <true, false> #add the option to close bootstrap windows on «choose»
	autoRender: <true, false> #to render or not the file tree automatically

## EXAMPLE

		var demoTree = new Filetree({
			url:'http://localhost/demo/file/',
			root:'/HOME/SEB/',
			defaultPath: '/HOME/SEB//EXTRA',
			el: 'fileTree',
			modal: true,
			autoRender: true
		});


## DEMO 
http://jsbin.com/aruqec/4/

## CREDITS
Based on Michael Hwang backbone file tree: https://github.com/terranmoccasin/backbone-filetree
