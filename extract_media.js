console.log('Hey!')

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log('event received ', request)
	if (request.method == "getImages"){
		var images = [];
		$('img').each(function() {
			if(this.width >= 200 && this.height >= 200){
				images.push({
					width: this.width,
					height: this.height,
					src: $(this).prop('src'),
				})
			}
		});
		sendResponse({
			'images': images,
			'current_url': document.URL
		});
	}
});
