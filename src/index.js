function sort_by_tag(tag_name){
    var list = document.getElementsByClassName("list-group");
    console.log(list);
    switching = true;
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list[0].getElementsByClassName("list-group-item");
        //console.log(b[0].children[5].getElementsbyTagName('a'));
        // Loop through all list items:
        for (i = 0; i < (b.length - 1); i++) {
            console.log()
        // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should
            switch place with the current item: */
            let anchs1 = b[i].getElementsbyTagName('a');
            let anchs2 = b[i+1].getElementsbyTagName('a');
            let val1 = 0, val2 = 0;
            if(anchs1.tag_name) val1 = anchs1.tag_name.attributes.value["value"];
            if(anchs2.tag_name) val2 = anchs2.tag_name.attributes.value["value"];
            if (val1 > val2) {
                /* If next item is alphabetically lower than current item,
                mark as a switch and break the loop: */
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark the switch as done: */
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
        }
    }
}