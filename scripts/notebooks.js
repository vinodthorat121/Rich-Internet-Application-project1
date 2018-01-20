document.addEventListener("DOMContentLoaded", function(event) {


	var timestamp;
	var options = {
		weekday: "long", year: "numeric", month: "short",
		day: "numeric", hour: "2-digit", minute: "2-digit"
	};

	$('#view-modal').on('show.bs.modal', function (event) {
		var button = $(event.relatedTarget);// Button that triggered the modal
		var note = button.data('whatever'); // Extract info from data-* attributes
		getNote(note.id);
	});

	$('#update-modal').on('show.bs.modal', function (event) {
		console.log('modal shown..');
		var button = $(event.relatedTarget);
		var recipient = button.data('whatever'); 
		var modal = $(this);
		modal.find('.modal-title').text('Update Note Form: Note ID['+recipient.id+']');
		modal.find('.modal-body input[id=modal-note-id]').val(recipient.id);
		modal.find('.modal-body input[id=modal-name]').val(recipient.author);
		modal.find('.modal-body input[id=modal-subject]').val(recipient.subject);
		modal.find('.modal-body textarea[id=modal-message]').val(recipient.message);
	});

	// open the database
	var openRequest = indexedDB.open("notebook", 4);
	
	openRequest.onupgradeneeded = function(e) {
		console.log("Upgrading database...");
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains('notes')) {
			var objectStore = thisDB.createObjectStore('notes', {keyPath: 'id', autoIncrement:true});
			objectStore.createIndex('author', 'author', {unique: false});
		}
		console.log("database upgrade complete.");
	};

	openRequest.onsuccess = function(e){ console.log('SUCCESS: Database connected...');
		db = e.target.result;
		document.getElementById('create').addEventListener('click', addNoteToDB, false);
		showNoteBook();
	};

	openRequest.onerror = function(e) {
		console.log('ERROR: Could not connect to database!');
	};

	var addBtn = document.getElementById('add');
	var createNoteFormDiv = document.querySelector('.create-note-form')
	var cancelBtn = document.getElementById('cancel');
	var createBtn = document.getElementById('create');

	document.getElementById('update-button').addEventListener('click', function () {
		console.log('update note called...');
		var transaction = db.transaction(["notes"],"readwrite");
		var store = transaction.objectStore("notes");
		var id = document.getElementById('modal-note-id').value;
		var name = document.getElementById('modal-name').value;
		var subject = document.getElementById('modal-subject').value;
		var message = document.getElementById('modal-message').value;
		console.log('updating note['+id+']');
		updateNote(id, name, subject, message);
	}, false);

	

	addBtn.addEventListener("click", function(){
		
		createNoteFormDiv.style.display = "block";
	});

	cancelBtn.addEventListener("click", function(){
		createNoteFormDiv.style.display = "none";
	});

	function clearForm(){
		var formInputs = document.querySelectorAll('.form-inputs');
		for(var i in formInputs){
			formInputs[i].value = '';
		}
	}

	function addNoteToDB(){
		console.log('addNoteToDB called');
		// Form Fields
		var subject = document.getElementById('subject').value;
		var author = document.getElementById('author').value;
		var message = document.getElementById('message').value;

		console.log('Subject: '+subject+' Author: '+author+' : Message: '+message);
		subject = subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		author = author.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		console.log('After avoiding Javascript Injection Subject: '+subject+' Author: '+author+' : Message: '+message);
		
		var isNull = author.value!='' && message.value!='' && subject.value!='';

		if (isNull) {
			timestamp = new Date();
			var noteObject = {
				subject: subject,
				author: author,
				message: message,
				datetime: timestamp.toLocaleTimeString("en-us", options)
			};

			var transaction = db.transaction(["notes"],"readwrite");
			var store = transaction.objectStore("notes");

			// add the note to the object store "notes"
			var request = store.add(noteObject);

			// callbacks for success and failure operations
			request.onsuccess = function(e) {
				console.log("SUCCESS: Note added!");
				createNoteFormDiv.style.display = "none";
				clearForm();
				showNoteBook();
			}

			request.onerror = function(e) {
				console.log("ERROR:", e.target.error.name);
			}
		} else {
			alert('Inputs cannot be blank.');
		} /* if closing */
	} /* function closing */

	
function showNoteBook(){

		console.log('showNoteBook called...');

		var transaction = db.transaction(['notes'],'readwrite');
		var store = transaction.objectStore('notes');
		var index = store.index('author');
		var output = '';

		var noRecords = true;
		var numberOfRecords = 0;
		 var countRequest = index.count();
		countRequest.onsuccess = function() {
			console.log('countRequest'+countRequest.result);
			numberOfRecords = countRequest.result;
		}
		index.openCursor().onsuccess = function(e) {
			// Loop over the array addressBook and insert into the page

			var cursor = e.target.result;

			

			if (cursor) {

				//numberOfRecords += 1;
				noRecords = false;
				console.log('Records are present');
				output += "<tr id='"+cursor.value.id+"'>";
				output += "<td>" + cursor.value.id + "</td>";
				output += "<td>" + cursor.value.subject + "</td>";
				
				//cursor.value.subject = cursor.value.subject.replace('&lt','<').replace('&gt', '>');
				//cursor.value.author = cursor.value.author.replace('&lt','<').replace('&gt', '>')
				cursor.value.message = cursor.value.message.replace(/&lt;/g, '<').replace(/&gt;/g, '>') ;
				console.log('After avoiding Javascript Injection Update Subject: '+cursor.value.message);
		
				
				var messageLength = cursor.value.message.length;

				output += "<td>" + messageLength + "</td>";


				output += "<td>" + cursor.value.datetime + "</td>";
				
				var note = { 
					id: cursor.value.id,
					author: cursor.value.author,
					subject: cursor.value.subject,
					message: cursor.value.message,
					datetime: cursor.value.datetime
				};


				output += "<td><button id='btn-delete-"+cursor.value.id+"' onclick='removeNote("+cursor.value.id+","+numberOfRecords+")' type='button' class='btn btn-info btn-sm'>Detele</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button id='btn-update-"+cursor.value.id+"' type='button' class='btn btn-info btn-sm' data-toggle='modal' data-whatever='"+JSON.stringify(note)+"' data-target='#update-modal'>Edit</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button id='btn-view-"+cursor.value.id+"' type='button' class='btn btn-info btn-sm' data-toggle='modal' data-whatever='"+JSON.stringify(note)+"' data-target='#view-modal'>View</button></td>";
				
				output += "</tr>";

				// adding the output to the html page
				//document.getElementById('notes').innerHTML = '';
				$("#notes").html('');
				
				$("#notes").html(output);
				

				// fetch next record
				cursor.continue();	
			} 

			if (noRecords == true || numberOfRecords == 0) {
				console.log('no notes');
				output = "<tr><td>There are no notes to display.<br>Click 'Add Note' to add your notes</td>";
				// adding the output to the html page
				$("#notes").html(output);	
			}
			
			document.getElementById('noteTitle').innerHTML = "Note Records - Notes are "+numberOfRecords;

		} /* onsuccess function close*/

		index.openCursor().onerror = function(e) { 
			console.log('notes could not be shown/fetched');
		}		
	}

// this function fetches the note from the database based on the ID passed as an argument.
function getNote(noteId){
	console.log('getNote['+noteId+']');

	var transaction = db.transaction(["notes"],"readonly");
	var store = transaction.objectStore("notes");
	var request  = store.get(parseInt(noteId));

	request.onsuccess = function(event) {
		console.log('SUCCESS: Note['+noteId+'] Retrieved::Record['+request.result.message+']');
		
		// creating text to display in view modal
		var str = 'Name: '+request.result.author+'<br>';
		str += 'Subject: '+request.result.subject+'<br>';
		str += 'Message: '+request.result.message+'<br>';
		str += 'Created Date: '+request.result.datetime+'<br>';
		
		var viewModalBody = document.getElementById('modal-body');
		viewModalBody.innerHTML = str;
		$('#view-modal').modal('show');		
	}

	request.onerror = function(event) {
		console.log('error while fetching the note from the database..');
	}
}

// this function updates the note record in the database
function updateNote(noteId, new_name, new_subject, new_message){
	
	console.log('updateNote['+noteId+']');

	var transaction = db.transaction(["notes"],"readwrite");
	var store = transaction.objectStore("notes");
	var request  = store.get(parseInt(noteId));

	request.onsuccess = function(event) {
		console.log('SUCCESS: Note['+noteId+'] Retrieved::Record['+request.result.message+']');

		var note = request.result;
		timestamp = new Date();
		note.author = new_name;
		note.subject = new_subject;
		note.message = new_message;
		note.datetime = timestamp.toLocaleTimeString("en-us", options)

		
		note.subject = note.subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		note.author = note.author.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		note.message = note.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		console.log('Updated Note after avoiding Injection['+note.author+ " : "+note.subject+" : "+note.message+']');
		
		
		
		var updateRequest = store.put(note);
		
		updateRequest.onsuccess = function(e){
			console.log('SUCCESS: Note updated...');		
			showNoteBook();
		};

		updateRequest.onerror = function(e) {
			console.log('ERROR: Could not update note!');
		};
	}

	request.onerror = function(event) {
		console.log('ERROR: Could not retrieve note!');
	}
} /*close of update function*/


});

//database
var db = '';

// this function removes the note from the database
function removeNote(id,numberOfRecords){
	console.log('removeNote['+id+']');

	var transaction = db.transaction(["notes"],"readwrite");
	var store = transaction.objectStore("notes");

	var request = store.delete(id);

	
	request.onsuccess = function() {
		console.log('SUCCESS: Note '+id+' Deleted');
		// removing record from the page
	numberOfRecords = numberOfRecords-1;
	
	
	$('#'+id).remove();
	
	if (numberOfRecords == 0) {
				console.log('no notes');
				output = "<tr><td>Currently, there are no notes to display.<br>Click 'Quick Add' to add your notes</td>";
				// adding the output to the html page
				$("#notes").html(output);	
			}
	document.getElementById('noteTitle').innerHTML = "Note Records - Notes are "+numberOfRecords;
		
	}
	
}







