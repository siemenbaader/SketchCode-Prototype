var CommitHistory = function( dom_element ) {
  // Has a currently checked out state, maybe a hovered state, and an ever growing list of commits
  // Also has some coupled controller logic for persisting and loading state, where it has side effects on the documents & depends on their design!

  var commits = JSON.parse(localStorage.sk_commit_history || '["//Keep this comment below everything else"]');
  
  var working_revision = commits.length -1;
  var commit_view = $(dom_element).find("commits")[0];

  dom_element.render = function() {
    var fragment = DocumentFragment();
    var elements = commits.map( function(commit, index) {
      var n = Node("<commit/>", " ");
      n.onmouseover = function() { dom_element.load( index ) };
      n.onmouseout  = function() { dom_element.load ( working_revision ) };
      n.onclick     = function() { dom_element.checkout( index ) };
      if (index === working_revision) { n.className = "working-revision"; }
      return n;
    });

    elements.forEach( function(el) { fragment.appendChild(el); }); 
    commit_view.innerHTML = '';
    commit_view.appendChild( fragment );
    commit_view.scrollLeft = elements[elements.length - 1].offsetLeft;
  };


  dom_element.save = function (state) {
    commits.push( state );
    working_revision = commits.length - 1; 
    localStorage.sk_commit_history = JSON.stringify( commits );
    dom_element.render();
  }
  
  dom_element.load = function( revision ){
    var load_rev = (revision || working_revision);
    code_editor.set_content( commits[ load_rev ] );
  };

  dom_element.checkout = function( revision ) {
    working_revision = revision;
    dom_element.load( revision );
    dom_element.render();
  }

  dom_element.render();
  return dom_element;  
}
