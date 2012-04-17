// TODO: refactor the menu + all events into a clean state something
// TODO: there is some bug there... the menu stays.
// Editor TO JS mixins

// (function(exports) {

HTMLSpanElement.prototype.to_constructor = function() { return "document.createElement('span')"; };

Text.prototype.to_js = function() { return this.wholeText; };
Text.prototype.to_constructor = function() { return "document.createTextNode(" + JSON.stringify(this.wholeText) +")"; };

HTMLBRElement.prototype.to_js = function() { return "\n" };
HTMLBRElement.prototype.to_constructor = function() { return "document.createElement('br')" };

HTMLElement.prototype.to_js = function() {
  //     if(this.getAttribute['to_js']) {   // only defined for intentions
  //       l(this);
  // must return some js string that can be evaled later, but with the right binding!

  //       var fields = [1,2,3];
  //       return "JS"//this.getAttribute['to_js'] + fields;
  //     }
  //     return "undef";
  // 
  /*    if(this.tagName == "intention") {
        var fields = $(this).find("field").toArray();
        }*/
  //      
  var contents = $(this).contents().toArray();
  return contents.map(function(i) { return i.to_js() }).join("");
};

HTMLCollection.prototype.map = Array.prototype.map;

var Comment = {
  match_text: "comment",
  menu_view: "<comment>Comment </comment>    <span class='type'>  Comment</span>",
  Entity: function() {
    var e = {};
    e.view = $("<comment contenteditable='false'><b>// Comment</b><hr/> <field contenteditable='true'/><br/></comment>")[0];
    e.view.setAttribute('to_js', 'function() {\
      var field = $(e.view).find("field")[0];\
      return "/*" + field.innerText + "*/";\
    }')
    return e;
  }
}


var DeclarationAssignment = {
  match_text: "var",
  menu_view: "<b>var</b> <field/> <b>=</b> <field/><b>;</b><span class='type'>  Declaration-Assignment</span>",
  Entity: function (name, value) {
    var e = {};
    if (!name) name = '';
    if (!value) value = '';

    e.fields  = [name , value];
    e.view    = $("<declaration-assignment contenteditable='false'><b>var</b> <field name='name' contenteditable='true'>" + name + "</field> <b>=</b> <field name='value' contenteditable='true'>" + value + "</field><b>;</b></declaration-assignment>")[0];

    e.view.to_js = e.to_js   = function() {
      var fields = $(e.view).find("field");
      // TODO: Now I just need to find a cleaner model of recursive to_js in everything that is inserted into the editor. no innerText
      return "var " + fields[0].to_js() + " = " + fields[1].to_js() + ";";
    };
    e.view.onclick = function() { IntentionInteractionWindowEditor( e.view ) };
    e.view.to_constructor = function() {
      var fields = $(e.view).find("field");
      return 'DeclarationAssignment.Entity("'+ fields[0].innerText + '","' + fields[1].innerText + '").view';   };

      return e;
  }
};

//TODO: make the views work with the cursor when they are plain text nodes; doc fragment etc so we can insert more lo-fi things as well
var VarText = {
  match_text: "var",
  menu_view: 'var<span class="type">         text</span>',
  Entity: function() { 
    var e = {};
    e.fields = [];
    e.view = document.createTextNode('var');
    e.view.to_js = function () { return 'var' };
    return e;
    //       {
    //         fields: [],
    //         view: document.createTextNode('var') //,
    // //         to_javascript: function() { return "var"; }
    //       };
  }
}

// var Fun =  {
//   match_text: "function",
//   menu_view: '<function><b>function</b> <field>&#160;</field>(<field>arg</field>) {<layouter contenteditable="true"><br/>&#160;\n        </layouter>        <field contenteditable="true"> &#160; </field><br/> }</function>',
//   Entity: function() {
//     var e = {};
// 
//     e.fields = ['name', 'arguments', 'body'];
// 
//     e.view = $("<function contenteditable='false'><b>function</b><field contenteditable='true'/>(<field contenteditable='true'/>) {<layouter contenteditable='true'><br/>&#160;\n        </layouter>\n        <field contenteditable='true'/><br/> }</function>" )[0];
// 
//     e.view.to_js = function() { 
//       var fields = $(e.view).find("field");
//       return "function " + fields[0].to_js() + "( " + fields[1].to_js() +" ) {\n  " + fields[2].to_js() + "\n}";
//     }
// 
// 
//     return e;
//   }
// }


function AutocompletionMenu(choices) {

  // Menu view
  var self = $("<dropdown_menu/>")[0];
  var index = 0; 
  var items;     
  var item_views;

  self.render = function( word_fragment ) {
    self.innerHTML = "";
    items = self.matching_choices_for( word_fragment);
    item_views = items.map( function(i) { return $("<item>" + i.menu_view + "</item>")[0] });       
    hilit_active_item();
    $(self).append( item_views );
  };

  function clear_active_item() {
    item_views[index].className = "";
  }

  function hilit_active_item() {
    item_views[index].className = "selected";
  }

  self.has_match_for = function(word_fragment) {
    return self.matching_choices_for( word_fragment ).length > 0;
  }

  self.matching_choices_for = function( word_fragment ) {
    return choices.filter( function(i) { return i.match_text === word_fragment });
  };

  self.down = function() {
    clear_active_item();
    index = Math.min (index + 1, items.length - 1);
    hilit_active_item();
  }

  self.up = function () {
    clear_active_item();
    index = Math.max (index - 1, 0);
    hilit_active_item();
  }
  self.choice = function() { return items[index].Entity(); };

  self.recalculate_matches_for = function( word_fragment ) {
    index = 0;

    self.render( word_fragment );
  };

  self.set_position = function( offset ) {
    self.style.position = "";
    self.style.top = "";
    self.style.left = "";

    $(self).offset( {left: offset['left'], top: offset['top'] + 15} ); 
  }
  return self;
}

function Cursor(editor) {

  var self = $("<cursor>|</cursor>")[0];

  //   editor.appendChild( self );

  //   self.update_dom_position = function() {
  //     $(self).remove();
  //     self.dom_range().insertNode( self );
  //   }


  self.position = function() {
    // this needle stuff will go away when the curser itself becomes a DOM element
    var needle = $("<span/>")
      var saved_sel = rangy.saveSelection();

    document.getSelection().getRangeAt(0).insertNode( needle[0] );
    var offset = needle.offset();

    rangy.restoreSelection(saved_sel);
    return offset;
  };

  self.word_under_range = function() {

    var saved_sel = rangy.saveSelection();

    var moving_sel = document.getSelection();

    moving_sel.modify("extend", "backward", "lineboundary");
    var line_range = moving_sel.getRangeAt(0);

    rangy.restoreSelection(saved_sel);

    var saved_sel = rangy.saveSelection();
    var moving_sel = document.getSelection();

    moving_sel.modify("extend", "backward", "word");
    var word_range = moving_sel.getRangeAt(0);

    rangy.restoreSelection(saved_sel);

    var word = word_range.toString();
    var line = line_range.toString();

    // The word API also looks at the line above. But we only want the current word on this line
    if (line_range.toString() === "") {
      return line_range;
    } else {
      return word_range;
    }
  };

  self.word_under = function() {
    return self.word_under_range().toString();    
  };

  self.insert_left = function( element ) {
    var needle = $("<span/>")[0];

    self.dom_range().insertNode( needle );

    var parent = needle.parentNode;
    parent.insertBefore( element , needle );
    parent.removeChild( needle );
    self.move_after( element );

  };

  self.delete_current_word = function() {
    var r = self.word_under_range();
    r.deleteContents();
  };

  self.dom_range = function () {
    return document.getSelection().getRangeAt(0);
  };

  self.move_after = function( element ) {
    var sel = document.getSelection();
    var r = sel.getRangeAt(0);

    r.setStartAfter( element );
    r.setEndAfter( element );
    sel.removeAllRanges();
    sel.addRange( r ); // maybe this is not executed immediately; rangeCount === 0 after..
  };


  //   self.move_inside = function( element ) {
  //     var sel = document.getSelection();
  //     var r = sel.getRangeAt(0);
  //     r.setStart( element, 0 );
  //     r.setEnd( element, 0 );
  //     sel.removeAllRanges();
  //     sel.addRange( r );
  //   };

  return self;

}


function Editor( self, intentions ) {

  self.render = function(){ l("NOOP"); };

  self.set_content = function (serialized_objects) {
    try {
      var objects = eval(serialized_objects);
      window.objects = objects;
      objects.forEach( function(obj) { self.appendChild( obj ); } );
    } catch (err) {
      l(err);
      alert("Err reading file. Valid format? Check log.");
    }

  };

  // returns a serialized form of its object contents and their state for persistence
  self.get_content = function () { 
    return "[" +  self.childNodes.map( function(node) { return node.to_constructor(); } ).join(", ") + "]";
  };

  var cursor = Cursor( self );
  self.cursor = cursor;

  var menu = AutocompletionMenu( intentions );
  self.menu = menu;


  self.contentEditable = "true";
  self.spellcheck = "false";

  var normal_mode = {
    onkeydown: function(event) {
                 if (event.keyIdentifier === "Enter") { 
                   var br = $("<br/>")[0];
                   cursor.insert_left( br );
                   event.preventDefault();
                   return;
                 }
                 if (["Left", "Right", "Up", "Down"].includes(event.keyIdentifier)) {
                   return;
                 }

                 // Do this after the browser has had the chance to rte the editor. Ask Ge.tt about this reactive style...
                 window.setTimeout( function() {
                   //cursor.update_dom_position();
                   var w = cursor.word_under();

                   if (menu.has_match_for( w ) ) {
                     self.go_to_menu_mode();
                   }
                 }, 0);
               }
  };

  var menu_mode = {
    onkeydown: function(event) {

                 if (event.keyIdentifier === "Up") { 
                   menu.up();
                   event.preventDefault();
                   return;
                 }

                 if (event.keyIdentifier === "Down") {
                   menu.down(); 
                   event.preventDefault();
                   return;
                 }

                 if (event.keyIdentifier === "Enter") { 
                   cursor.delete_current_word();
                   cursor.insert_left( menu.choice().view );

                   event.preventDefault();

                   self.go_to_normal_mode();
                   return;
                 }

                 if (["U+001B", "Left", "Right"].includes( event.keyIdentifier )) {
                   self.go_to_normal_mode();
                   return;
                 }

                 // Do this after the browser has had the chance to update the editor. Ask Ge.tt about this reactive style...
                 window.setTimeout( function() {
                   var w = cursor.word_under();

                   if (! menu.has_match_for( w )) {
                     self.go_to_normal_mode();
                   } else {
                     menu.recalculate_matches_for( w );
                   }
                 }, 0);
                 // The event goes on for normal typing..
               }
  };

  self.mode = normal_mode;

  self.onkeydown = function (event) {

    /*      if (event.keyIdentifier === "Enter" && event.ctrlKey) {
            eval(self.to_js());
            event.preventDefault();
            return;
            }*/
    self.mode.onkeydown(event);
  };


  self.go_to_menu_mode = function() {
    self.mode = menu_mode;
    menu.recalculate_matches_for( cursor.word_under() );
    self.appendChild( menu );
    menu.set_position( cursor.position() );
  };

  self.go_to_normal_mode = function() {
    self.removeChild(menu);
    self.mode = normal_mode;
  };
  return self;
}

//   exports.Editor = Editor;

// }(window));
