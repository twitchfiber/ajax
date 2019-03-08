
document.addEventListener("DOMContentLoaded", bindButtons);
function bindButtons() {
    // bind insert button
    document.getElementById("insert").addEventListener("click", (event) => {
        var xhr = new XMLHttpRequest();
        var new_row = {};

        // get form data and store inside of new_row object
        new_row.name = document.getElementById("name").value;
        new_row.reps = document.getElementById("reps").value;
        new_row.weight = document.getElementById("weight").value;
        new_row.unit = document.getElementById("unit").value;
        new_row.date = document.getElementById("date").value;

        // input validation
        if (new_row.name === "") {
            alert("Name cannot be empty");
            return;
        }
        else if (new_row.reps < 1 || new_row.reps.textContent === null) {
            alert("Invalid reps entered");
            return;
        }
        else if (new_row.weight < 1 || new_row.textContent === null) {
            alert("Invalid weight entered");
            return;
        }
        else if (new_row.date === "") {
            alert("Enter a valid date");
            return;
        }

        // open a post request to node.js file
        xhr.open("POST", "/insert", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        // once request is finished...
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                var response = JSON.parse(xhr.response);
                var storage = [response.id, response.name, response.reps, response.weight, response.unit, convertDate(response.date)];
                
                // make new row
                var row = document.createElement("tr");
                row.setAttribute("id", response.id);
                
                // add all the <td> elements to <tr>
                for (var i = 1; i < storage.length; i++) {
                    var td = document.createElement("td");
                    td.contentEditable = "true";
                    td.textContent = storage[i];
                    row.appendChild(td);
                };

                // create an edit button
                var edit = createEditButton(response.id);
                row.appendChild(edit);

                // create a delete button
                var del = createDeleteButton(response.id);
                row.appendChild(del);
                
                document.getElementById("output").appendChild(row);
            }
            else {console.log("Error!" + xhr.statusText)};
        });
        xhr.send(JSON.stringify(new_row));
        event.preventDefault();
    });

    // bind query button
    document.getElementById("get").addEventListener("click", (event) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/get", true);
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                var response = JSON.parse(xhr.response);
                var output = document.getElementById("output");
                output.innerHTML = "";

                response.results.forEach(element => {
                    // make new row
                    var row = document.createElement("tr");
                    row.setAttribute("id", element.id);
                    
                    // add all the <td> elements to <tr>
                    for(var prop in element) {
                        if (prop === "id") {
                            continue;
                        }
                        else if (prop === "date") {
                            var td = document.createElement("td");
                            td.contentEditable = "true";
                            td.textContent = convertDate(element[prop]);
                            row.appendChild(td);
                            continue;
                        }
                        var td = document.createElement("td");
                        td.contentEditable = "true";
                        td.textContent = element[prop];
                        row.appendChild(td);
                    };

                    // create an edit button
                    var edit = createEditButton(element.id);
                    row.appendChild(edit);

                    // create a delete button
                    var del = createDeleteButton(element.id);
                    row.appendChild(del);

                    output.appendChild(row);
                });
            };
        });
        xhr.send(null);
        event.preventDefault();
    });
};

// bind delete button
function createDeleteButton(id) {
    var del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", (event) => {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/delete", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                var deletion_Target = document.getElementById(id);
                deletion_Target.parentNode.removeChild(deletion_Target);
            };
        });
        xhr.send(JSON.stringify({id: id}));
    });
    return del;
};

// bind edit button
function createEditButton(id) {
    // make button
    var edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.addEventListener("click", (event) => {
        var xhr = new XMLHttpRequest();

        // get the current row data of id <tr>
        var curr_vals = [];
        var children = document.getElementById(id).children;
        for(var i = 0; i < children.length; i++) {
            if (children[i].tagName === "TD") {
                curr_vals.push(children[i].textContent);
            }
        };

        // put td data into context to send as post request
        var context = {
            id: id,
            name: curr_vals[0],
            reps: curr_vals[1],
            weight: curr_vals[2],
            unit: curr_vals[3],
            date: convertDateForSQL(curr_vals[4])
        };
        console.log("Context:", context);
        xhr.open("POST", "/edit", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                // newly updated row to be displayed contained in response
                var response = JSON.parse(xhr.response);
                var new_row = document.getElementById(id).children;
                console.log("Response:", response);
                new_row[0].value = response.name;
                new_row[1].value = response.reps;
                new_row[2].value = response.weight;
                new_row[3].value = response.unit;
                new_row[4].value = response.date;
            }
            else {console.log("Error, couldn't post edit request")};
        });
        xhr.send(JSON.stringify(context));
    });
    return edit;
};

// date conversion function - source: https://stackoverflow.com/questions/36950056/convert-mysql-date-format-to-dd-mm-yy-date-format-using-javascript
function convertDate(date) {
    var myDate = new Date(date);
    var result = (myDate.getMonth() + 1) + '/' + myDate.getDate() + '/' + myDate.getFullYear();
    return result;
};

function convertDateForSQL(date) {
    var myDate = new Date(date);
    var result =+ myDate.getFullYear() + '-' + (myDate.getMonth() + 1) + '-' + myDate.getDate();
    return result;
};
