///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/dom-construct',  //MJM - For map links - https://dojotoolkit.org/reference-guide/1.10/dojo/dom-construct.html	
    'esri/tasks/GeometryService', //MJM - projection	
    'esri/SpatialReference', //MJM - projection
    './common',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/utils',
    'jimu/BaseWidget'
  ],
  function(declare, html, query, on, lang, 
    domConstruct, GeometryService, SpatialReference,
    common, _WidgetsInTemplateMixin, jimuUtils, BaseWidget) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',

      postCreate: function () {
        this.inherited(arguments);
        gsvc = new GeometryService("https://gis.cityoftacoma.org/arcgis/rest/services/Utilities/Geometry/GeometryServer");  //MJM - Geometry Service - for reprojecting
      },

      startup: function () {
        this.inherited(arguments);
        if (common.isDefaultContent(this.config)) {
          this.config.about.aboutContent = common.setDefaultContent(this.config, this.nls);
        }
        this.isOpen = true;

        this.openAtStartAysn = true;
        this.resize();

        this.openAtStartAysn = true;
        if(jimuUtils.isAutoFocusFirstNodeWidget(this)){
          this.customContentNode.focus();
        }

        //Focus customContentNode
        //use firstTabNode for passing focus state to customContentNode (FF)
        this.own(on(this.splashContainerNode, 'focus', lang.hitch(this, function(){
          this.firstTabNode.focus();
        })));
        this.own(on(this.firstTabNode, 'focus', lang.hitch(this, function(){
          this.customContentNode.focus();
        })));

        jimuUtils.setWABLogoDefaultAlt(this.customContentNode);
      },

      resize: function () {
        this._resizeContentImg();
      },

      _getGoogleMap: function() {  //MJM
        var currentLatitude = this.map.extent.getCenter().getLatitude();
        var currentLongitude = this.map.extent.getCenter().getLongitude();
        var currentZoomLevel = this.map.getZoom();
        //console.error(currentZoomLevel);
        window.open('https://maps.google.com/?q=' + currentLatitude + ',' + currentLongitude + '&z=' + currentZoomLevel + '&layer=c&cbll=' + currentLatitude + ',' + currentLongitude + '&cbp=11,0,0,0,0');
      },

      _getGovMeMap: function() {  //MJM
        var point = this.map.extent.getCenter();    //current map center point coordinates
        var outSR = new SpatialReference(2286);
 
        gsvc.project([ point ], outSR, function(projectedPoints) {
          pt = projectedPoints[0];
          //add a check here for non-IE browsers - gMap only works on IE
          window.open('http://www.govme.org/gMap/MGMain.aspx?Type=Tidemark&X=' + pt.x.toFixed() + '&Y=' + pt.y.toFixed() + '&Width=500');
        });
       //IE 11 check
        //console.error(/rv:11/i.test(navigator.userAgent));  //rv 11 for IE 11
      },

      onOpen: function(){
        this.isOpen = true;
        //resolve issue #15086 when network is so slow.
        setTimeout(lang.hitch(this, function(){
          this.isOpen = false;
        }), 50);
      },

      _resizeContentImg: function () {
        //record current activeElement before resizing
        var _activeElement = document.activeElement;
        html.empty(this.customContentNode);

        //MJM - Add GovME Map | Google Map links
        //var aboutContent = html.toDom(this.config.about.aboutContent);
        var mapLinks = "<div style='text-align: center;'><span id='Map1'></span> | <span id='Map2'></span><br>&nbsp;</div>";	
        var aboutContent = html.toDom(this.config.about.aboutContent + mapLinks);	
        //end MJM

        html.place(aboutContent, this.customContentNode);
        // single node only(no DocumentFragment)
        if (this.customContentNode.nodeType && this.customContentNode.nodeType === 1) {
          var contentImgs = query('img', this.customContentNode);
          if (contentImgs && contentImgs.length) {
            contentImgs.forEach(lang.hitch(this, function (img) {
              var isNotLoaded = ("undefined" !== typeof img.complete && false === img.complete) ? true : false;
              if (isNotLoaded) {
                this.own(on(img, 'load', lang.hitch(this, function () {
                  this._resizeImg(img);
                })));
              } else {
                this._resizeImg(img);
              }
            }));
          }

          //Init dom's attrs and events again because doms are new after resizing.
          var focusableNodes = jimuUtils.getFocusNodesInDom(this.domNode);
          if(focusableNodes.length){
            jimuUtils.initFirstFocusNode(this.domNode, focusableNodes[0]);
            jimuUtils.initLastFocusNode(this.domNode, focusableNodes[focusableNodes.length - 1]);
          }

          //focus firstNode if required
          if(this.isOpen || html.isDescendant(_activeElement, this.domNode)){
            var firstNode = jimuUtils.getFirstFocusNode(this.domNode);
            if(jimuUtils.isAutoFocusFirstNodeWidget(this)){
              firstNode.focus();
            }
            this.isOpen = false;
          }
        }
          //MJM - Update click event for map links	
          //Method to add click event  - Need lang.hitch to keep scope of function within widget	
          //Google Map - Map1	
          domConstruct.create("span", {innerHTML: "<span style='color: blue; text-decoration: underline; cursor: pointer;' title='Open Google Map @ current location'>Google Map</span>"}, dojo.byId("Map1"));	
          on(dojo.byId("Map1"), 'click', lang.hitch(this, this._getGoogleMap));	
          //govME Map - Map2	
          domConstruct.create("span", {innerHTML: "<span style='color: blue; text-decoration: underline; cursor: pointer;' title='Open govME Map @ current location'>govME Map</span>"}, dojo.byId("Map2"));	
          on(dojo.byId("Map2"), 'click', lang.hitch(this, this._getGovMeMap));	
          //end MJM	
      },
      _resizeImg: function(img) {
        var customBox = html.getContentBox(this.customContentNode);
        var imgSize = html.getContentBox(img);
        if (imgSize && imgSize.w && imgSize.w >= customBox.w) {
          html.setStyle(img, {
            maxWidth: (customBox.w - 20) + 'px', // prevent x scroll
            maxHeight: (customBox.h - 40) + 'px'
          });
        }
      }
    });
    return clazz;
  });