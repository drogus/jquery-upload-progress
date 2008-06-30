/*
 * jquery.uploadProgress
 *
 * Copyright (c) 2008 Piotr Sarnacki (drogomir.com)
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */
(function($) {
	if($.browser.safari && $('iframe[name=progressFrame]', parent.document).length == 0) {
		$(function() {
			iframe = document.createElement('iframe');
			iframe.name = "progressFrame";
			$(iframe).css({width: '0', height: '0', position: 'absolute', top: -3000});
			document.body.appendChild(iframe);
			
			var d = iframe.contentWindow.document;
			d.open();
			/* weird - safari won't load scripts without this lines... */
			d.write('<html><head></head><body></body></html>');
			d.close();
			
			var b = d.body;
			var s = d.createElement('script');
			s.src = "../lib/jquery.js";
			/* must be sure that jquery is loaded */
			s.onload = function() {
				var s1 = d.createElement('script');
				s1.src = "../jquery.uploadProgress.js";
				b.appendChild(s1);
			}
			b.appendChild(s);
		});
  	}

  $.fn.uploadProgress = function(options) {
	return this.each(function(){
		$(this).bind('submit', function() {
			var uuid = "";
			for (i = 0; i < 32; i++) { uuid += Math.floor(Math.random() * 16).toString(16); }
			
			options = $.extend({
				interval: 2000,
				progressBar: "#progressbar",
				progressUrl: "/progress",
				start: function() {},
				uploading: function() {},
				complete: function() {},
                                timer: ""
			}, options);
                        /* update uuid */
                        options.uuid = uuid;
			/* start callback */
			options.start();

			/* patch the form-action tag to include the progress-id 
                           if X-Progress-ID has been already added just replace it */
                        if(old_id = /X-Progress-ID=([^&]+)/.exec($(this).attr("action"))) {
                          var action = $(this).attr("action").replace(old_id[1], uuid);
                          $(this).attr("action", action);
                        } else {
			  $(this).attr("action", jQuery(this).attr("action") + "?X-Progress-ID=" + uuid);
			}
			var uploadProgress = $.browser.safari ? progressFrame.jQuery.uploadProgress : jQuery.uploadProgress;
			options.timer = window.setInterval(function() { uploadProgress(this, options) }, options.interval);
		});
	});
  };

jQuery.uploadProgress = function(e, options) {
	jQuery.ajax({
		type: "GET",
		url: options.progressUrl,
		dataType: "json",
		beforeSend: function(xhr) {
			xhr.setRequestHeader("X-Progress-ID", options.uuid);
		},
		success: function(upload) {
			if (upload.state == 'uploading') {
				upload = $.extend({
				  percents: Math.floor((upload.received / upload.size)*1000)/10
				}, upload);
				
			bar = $.browser.safari ? $(options.progressBar, parent.document) : $(options.progressBar);
              		bar.width(Math.floor(upload.percents) + '%');
			  options.uploading(upload);
			}
			/* we are done, stop the interval */
			if (upload.state == 'done') {
				window.clearTimeout(options.timer);
				options.complete(upload);
			}
		}
	});
};

})(jQuery);
