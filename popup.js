// storage prefix key
var stgkp = 'mfyz_wp_post_';

var url = '';
var login = '';
var password = '';
var userid = 0;
var current_url = '';

var success_btn = '<button id="btn_post" class="btn btn-large btn-success"><i class="icon-ok icon-white"></i> Post published !</button>';
var loading_btn = '<button id="btn_post" class="btn btn-large btn-info disabled"><i class="icon-glass icon-white"></i> Posting...</button>';
var warning_btn = '<button id="btn_post" class="btn btn-large btn-warning disabled"><i class="icon-fire icon-white"></i> Posting failed !</button>';
var connect_btn = '<button id="btn_post" class="btn btn-large btn-error disabled"><i class="icon-resize-full icon-white"></i> Connection problem !</button>';

function show_toast(msg) {
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
			chrome.tabs.sendMessage(tabs[0].id, {
				method: "getImages", 
			}, function(response) {
				var imagesArr = response.images;
				current_url = response.current_url;
				
				if(imagesArr.length > 0){
					var image_selector = '';
					for (i in imagesArr) {
						
					}
					$('#post_image').html(image_selector);
				}
				
				get_categories();
				
				$('#btn_post').click(function(){
					prepare_content();
				});
			});
		});
	}
});

function prepare_content(img, content, media, featimgid) {
	// Upload selected image
	//get_uploaded_img_url(selectedimgsrc, content, media, true)

	content = content.replace('[source]', '<a href="'+current_url+'" target="_blank">source</a>');
	var post = img+content+media;
	var title = $('#post_title').val();
	var category = parseInt($("#post_category option:selected").val());
	var tags = $("#post_tags").val().replace(/[`~!@#$%^&*()_|+\-=?;:'".<>\{\}\[\]\\\/]/gi, '');
	
	tags = $.trim(tags);
	var tagtab = tags.split(/[\s,]+/);
	tagtab = $.grep(tagtab, function(n){
		return (n !== "" && n !== " " && n != null);
	});
	
	post_to_worpress(title, post, category, tagtab, featimgid);
}

function get_uploaded_img_url(file, content, media, insertimg){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", file, true);
	xhr.responseType = 'arraybuffer';

	var filename = $.url('file',file);
	var fileext = $.url('fileext',file);
	var mime = "image/jpeg";
	if (fileext == 'png') mime = "image/png";
	else if (fileext == 'gif') mime = "image/gif";
	
	xhr.onload = function(e) {
		//console.log(filename+' - '+mime);
		$.xmlrpc({
			url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
			dataType: 'xml',
			methodName: 'wp.uploadFile',
			params: [1, login, password,
				{name: filename,
					type: mime,					
					bits: e.currentTarget.response,
					overwrite: true
				}
			],
			success: function(response){
				var img = '';
				if (insertimg == true) {img = '<p><img src="' + response[0].url + '" width="'+width+'" /></p>';}
				// ready to submit
				// postek(img, content, media, response[0].id);
			},
			error: function(err, status, thrown){
				console.log(err);
				console.log(status);
			}
		});	
	};
	xhr.send();
}

function post_to_worpress(title, post, selcategory, tagtab, featimgid){
	$.xmlrpc({
		url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
		methodName: 'wp.newPost',
		params: [1, login, password, 
			{
				post_type: 'post', 
				post_status: 'publish', 
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
			
			if(post_id){
				$('#post_button').html(success_btn);
			}
			else{
				$('#post_button').html(warning_btn);
			}
			window.setInterval( function(){window.close();}, 2000);
		},
		error: function(err, status, thrown){
			switch(status){
				case 'timeout':
				$('#post_button').html(connect_btn);
				break;
				
				case 'error':
				$('#post_button').html(warning_btn);
				break;
				
				default:
				$('#post_button').html(warning_btn);
			}
			window.setInterval( function(){window.close();}, 2000);
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
