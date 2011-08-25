var Fun =  {
  match_text: "function",
  menu_view: '<function><b>function</b> <field>&#160;</field>(<field>arg</field>) {<layouter contenteditable="true"><br/>&#160;\n        </layouter>        <field contenteditable="true"> &#160; </field><br/> }</function>',
  Entity: function() {
    var e = {};

    e.fields = ['name', 'arguments', 'body'];

    e.view = $("<function contenteditable='false'><b>function</b><field contenteditable='true'/>(<field contenteditable='true'/>) {<layouter contenteditable='true'><br/>&#160;\n        </layouter>\n        <field contenteditable='true'/><br/> }</function>" )[0];

    e.view.to_js = function() { 
      var fields = $(e.view).find("field");
      return "function " + fields[0].to_js() + "( " + fields[1].to_js() +" ) {\n  " + fields[2].to_js() + "\n}";
    }


    return e;
  }
}

var StateChart = {
  match_text: "state",
  menu_view: '<b>State Chart</b>',
  Entity: function() {
    var e = {};

    e.fields = ['name', 'arguments', 'body'];

    e.view = $("<img src='state-chart.svg'/>")[0];
    
    e.view.to_js = function() { 
     return '"state: RED"';
    }

    return e;
  }
};

intentions.push( StateChart )

