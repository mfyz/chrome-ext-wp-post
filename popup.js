// storage prefix key
var stgkp = 'mfyz_wp_post_';

var url = '';
var login = '';
var password = '';
var userid = 0;
var current_url = '';

function show_toast(msg, className) {
	if (!className) className = 'warning';
	$('#toast').removeClass('alert-warning alert-danger alert-success').addClass('alert-' + className);
	$('#toast-msg').html(msg);
	$('#toast').slideDown();
	setTimeout(function(){ hide_toast() }, 4000);
}

function hide_toast() {
	$('#toast').slideUp();
}

$(window).ready(function(){	
	set_blog_vars();

	if(!url || !login || !password || userid == 0){
		show_toast('<a href="/options.html">You blog is not connected yet! Click here to go to settings.</a>');
	}
	else{
		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			chrome.tabs.executeScript({
				file: 'extract_media.js'
			});
			setTimeout(function(){
				chrome.tabs.sendMessage(tabs[0].id, {
					method: "getImages", 
				}, function(response) {
					var imagesArr = response.images;
					current_url = response.current_url;
					
					if(imagesArr.length > 0){
						var image_selector = '';
						for (i in imagesArr) {
							var img = imagesArr[i];
							image_selector += '<img src="' + img.url + '" height="150">';
						}
						$('#post_image').html(image_selector);
						$('#post_image img').click(function(){
							$('#post_image img').removeClass('selected');
							$(this).addClass('selected');
						});
						$('#post_image img:first').addClass('selected');
					}
					
					get_categories();
					
					$('#btn_post').click(function() {
						if ($('#buttons').hasClass('disabled')) return;
						$('#buttons').addClass('disabled');
						$('#btn_post').html('Publishing...');
						prepare_content();
					});
					
					$('#btn_draft').click(function() {
						if ($('#buttons').hasClass('disabled')) return;
						$('#buttons').addClass('disabled');
						$('#btn_draft').html('Saving...');
						prepare_content(true);
					});
				});
			}, 100)
		});
	}
});

function resetFormSubmitState(){
	$('#buttons').removeClass('disabled');
	$('#btn_publish').html('Publish');
	$('#btn_draft').html('Save Draft');
}

function prepare_content(asDraft) {
	var content = $('#post_content').val();
	content = content.replace('[source]', '<a href="' + current_url + '" target="_blank">source</a>');

	var post = content;
	var title = $('#post_title').val();
	var category = parseInt($("#post_category option:selected").val());
	var tags = $("#post_tags").val().replace(/[`~!@#$%^&*()_|+\-=?;:'".<>\{\}\[\]\\\/]/gi, '');
	
	tags = $.trim(tags);
	var tagtab = tags.split(/[\s,]+/);
	tagtab = $.grep(tagtab, function(n){
		return (n !== "" && n !== " " && n != null);
	});

	// validations
	if (title.length < 1) {
		show_toast("Title can't be empty");
		resetFormSubmitState();
		return;
	}

	var selectedimgsrc = $('#post_image img.selected').attr('src');
	if (selectedimgsrc) {
		get_uploaded_img_url(selectedimgsrc, function(err, response){
			if (err) {
				show_toast('Image upload failed!', 'danger')
				resetFormSubmitState();
				return;
			}
			// post = '<p><img src="' + response.url + '" /></p>' + post;
			post_to_wordpress(title, post, category, tagtab, response.id, asDraft);
		})
	}
	else {
		// post without image
		post_to_wordpress(title, post, category, tagtab, null, asDraft);
	}
}

function get_uploaded_img_url(file, cb){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.responseType = 'arraybuffer';

	var filename = $.url('file', file);
	var fileext = $.url('fileext', file);
	var mime = "image/jpeg";
	if (fileext == 'png') mime = "image/png";
	else if (fileext == 'gif') mime = "image/gif";
	
	xhr.onload = function(e) {
		//console.log(filename+' - '+mime);
		$.xmlrpc({
			url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
			dataType: 'xml',
			methodName: 'wp.uploadFile',
			params: [1, login, password, {
				name: filename,
				type: mime,					
				bits: e.currentTarget.response,
				overwrite: true
			}],
			success: function(response){
				cb(false, response[0]);
			},
			error: function(err, status, thrown){
				cb(err, null);
			}
		});	
	};
	xhr.send();
}

function post_to_wordpress(title, post, selcategory, tagtab, featimgid, statusIsDraft){
	$.xmlrpc({
		url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
		methodName: 'wp.newPost',
		params: [1, login, password, 
			{
				post_type: 'post', 
				post_status: (statusIsDraft ? 'draft' : 'publish'), 
				post_author: userid, 
				post_title: title, 
				post_content: post,
				comment_status: 'open',
				post_thumbnail: featimgid,
				terms: { category: [selcategory] },
				terms_names : { post_tag: tagtab }
			}
		],
		success: function(response){
			var xml = $($.parseXML(response));
			var post_id = xml.find('post_id');
			resetFormSubmitState();
			if(post_id){
				show_toast('Successfully Posted!', 'success');
			}
			setTimeout( function(){ window.close(); }, 2000);
		},
		error: function(err, status, thrown){
			resetFormSubmitState();
			switch(status){
			case 'timeout':
				show_toast('Timeout!');
				break;
			case 'error':
			default:
				show_toast('Posting Failed!', 'danger');
				break;
			}
		}
	});
}

function get_categories() {
	$.xmlrpc({
		url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
		dataType: 'xml',
		methodName: 'wp.getTerms',
		params: [1, login, password, 'category'],
		success: function(response){
			$.each(response[0], function(index, value) {
				$('#post_category').append('<option value="' + value['term_id'] + '">' + value['name'] + '</option>');
			});
		},
		error: function(err, status, thrown){
			var xml = $($.parseXML(err));
			console.log(xml);
		}
	});
}

function set_blog_vars() {
	url = localStorage[stgkp + '_url'];
	login = localStorage[stgkp + '_login'];
	password = localStorage[stgkp + '_password'];
	userid = localStorage[stgkp + '_userid'];
}
