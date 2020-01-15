
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	// console.log('event received ', request)
	if (request.method == "getImages"){
		var images = [];
		var imgTags = document.querySelectorAll('img');
		for (i in imgTags) {
			var img = imgTags[i]
			if(img.width >= 200 && img.height >= 200){
				images.push({
					width: img.width,
					height: img.height,
					url: img.src,
				})
			}
		}
		// console.log('images', images)
		sendResponse({
			'images': images,
			'current_url': document.URL
		});
	}
});
