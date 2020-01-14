// storage prefix key
var stgkp = 'mfyz_wp_post_';

$(document).ready(function(){
	$('#input_url').val(localStorage[stgkp + '_url']);
	$('#input_login').val(localStorage[stgkp + '_login']);
	$('#input_password').val(localStorage[stgkp + '_password']);
	
	$('#btn_save').click(function(){
		get_user_info($('#input_url').val(), $('#input_login').val(), $('#input_password').val());
	});
});

//----------------------------------------------------------------------------------------------

function get_user_info(url, login, password){
	$.xmlrpc({
		url: 'https://cors-anywhere.herokuapp.com/' + url + '/xmlrpc.php',
		dataType: 'xml',
		methodName: 'wp.getProfile',
		params: [1, login, password],
		success: function(response) {
			save_options(response);
		},
		error: function(err, status, thrown) {
			console.log(err);
			console.log(status);
		}
	});
}

function save_options(response) {
	localStorage[stgkp + '_url'] = $('#input_url').val();
	localStorage[stgkp + '_login'] = $('#input_login').val();
	localStorage[stgkp + '_password'] = $('#input_password').val();
	localStorage[stgkp + '_userid'] = response[0]['user_id'];
	$('#btn_save').removeClass("btn-primary");
	$('#btn_save').addClass("btn-success");
	$('#btn_save').html("The settings were succesfully saved. You can close this page and begin to use Post to Wordpress!");
}
