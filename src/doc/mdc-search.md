https://mdcwp.ml/
https://github.com/touficbatache/material-components-web-wordpress/blob/master/css/custom_styles.css

<section class="mdc-toolbar__section mat-search--desktop mdc-ripple-surface mdc-ripple-upgraded">
<div class="mat-search--desktop__wrapper">
  <form role="search" method="get" id="searchform" class="searchform" action="https://mdcwp.ml/" >
    <label class="mat-search--desktop__icon mat-search--desktop__content material-symbols-outlined" for="mat-search--desktop__input">search</label>
    <input class="mat-search--desktop__input mat-search--desktop__content mdc-typography" id="mat-search--desktop__input" value="" name="s" placeholder="Search">
  </form>
</div>
</section>
<script>
if (document.querySelector('.mat-toolbar--open-search') && document.querySelector('.mat-toolbar--exit-search')) {
	var searchIcon = document.querySelector('.mat-toolbar--open-search');
	document.querySelector('.mat-toolbar--open-search').addEventListener('click', function() {
		document.querySelector('.mat-toolbar--search').style = "visibility: visible; overflow: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - searchIcon.offsetLeft - 20) + "px;";
		document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--open-search 0.7s forwards; -webkit-transform: translateZ(0);";
		document.querySelector('.mat-toolbar--search-text').focus();
		if(document.querySelector('.mat-toolbar__row--tab-bar')){
			document.querySelector('.mat-toolbar__row--tab-bar').classList.add('mat-margin-animation');
			if(document.querySelector('.mat-toolbar-adjust')){document.querySelector('.mat-toolbar-adjust').classList.add('mat-margin-animation')};
			setTimeout(function() {
				document.querySelector('.mat-toolbar__row--tab-bar').style.cssText += "display: none";
			}, 300);
		}
	});
	document.querySelector('.mat-toolbar--exit-search').addEventListener('click', function() {
		document.querySelector('.mat-toolbar--search-container').style = "animation: mat-toolbar--close-search 0.5s forwards; -webkit-transform: translateZ(0);";
		setTimeout(function() {document.querySelector('.mat-toolbar--search').style = "visibility: hidden; --mat-toolbar--search-location: " + (document.body.clientWidth - searchIcon.offsetLeft - 20) + "px;";}, 500);
		document.querySelector('.mat-toolbar--search-text').value = '';
		if(document.querySelector('.mat-toolbar__row--tab-bar')){
			document.querySelector('.mat-toolbar__row--tab-bar').style = "display: block;";
			setTimeout(function() {
				document.querySelector('.mat-toolbar__row--tab-bar').classList.remove('mat-margin-animation');
				if(document.querySelector('.mat-toolbar-adjust')){document.querySelector('.mat-toolbar-adjust').classList.remove('mat-margin-animation')};
			}, 100);
		}
	});
}

if(document.querySelector('.clear-search-query')) {
	document.querySelector('.clear-search-query').addEventListener('click', function() {
		document.querySelector('.mat-toolbar--search-text').value = '';
		document.querySelector('.mat-toolbar--search-text').focus();
	});
}
</script>


<link>

	/*
		==============================
		   Main Styling
		==============================
	*/
	* {
		-webkit-tap-highlight-color: transparent;
	}
	
	html {
		height: 100%;
	}
	
	body {
		padding: 0;
		margin: 0;
		box-sizing: border-box;
		background-color: #fafafa;
		visibility: hidden;
		height: 100%;
    }
	
    main {
		margin: 0px;
    }
	
	a {
		text-decoration: none;
		color: var(--mdc-theme-primary);
	}

	/*
		==============================
		   Material Design Icons
		==============================
	*/
	.material-symbols-outlined{
		cursor: pointer;
		text-decoration: none;
	}
	
	/*
		==============================
		   Material Design Scrollbar
		==============================
	*/
	*::-webkit-scrollbar {
		width: 11px;
		height: 11px;
	}
	*::-webkit-scrollbar-button {
		width: 0;
		height: 0;
		display: none;
	}
	*::-webkit-scrollbar-thumb:active {
		background-color: rgba(0,0,0,0.5);
		-webkit-box-shadow: inset 1px 1px 3px rgba(0,0,0,0.35);
	}
	*::-webkit-scrollbar-thumb:hover {
		background-color: rgba(0,0,0,0.4);
		-webkit-box-shadow: inset 1px 1px 1px rgba(0,0,0,0.25);
	}
	*::-webkit-scrollbar-thumb {
		background-color: rgba(0,0,0,0.2);
		-webkit-box-shadow: inset 1px 1px 0 rgba(0,0,0,0.10), inset 0 -1px 0 rgba(0,0,0,0.07);
	}
	*::-webkit-scrollbar-track:vertical{-webkit-box-shadow:inset 1px 1px 0 rgba(0,0,0,0.14),inset -1px -1px 0 rgba(0,0,0,0.07);}
	*::-webkit-scrollbar-track:vertical:hover{background-color:rgba(0,0,0,0.035);}
	
	/*
		==============================
		  Drawer Component
		==============================
	*/
	.mdc-temporary-drawer__drawer {
		width: calc(100% - 56px);
		max-width: 305px;
	}
	
	/*
		==============================
		  MDC-WP Ripple Effect
		==============================
	*/
	.mat-ripple-effect {
        width: 24px;
		height: 24px;
		padding: 0;
		position: absolute;
    }
	
	/*
		==============================
		  Search Component
		==============================
	*/
	.mat-toolbar--exit-search {
		color: Grey;
	}
	.mat-toolbar--search {
		visibility: hidden;
		background-color: transparent;
		z-index: 4;
		position: fixed;
	}
	.mat-toolbar--search-container {
	  background: white;
	}
	.mdc-textfield--fullwidth:not(.mdc-textfield--multiline) {
		height: auto;
	}
	.mat-search--desktop {
		height: 42px;
		border-radius: 2px;
		background: rgba(255, 255, 255, .15);
		flex: 2;
		flex-direction: column;
		justify-content: center;
	}
	.mat-search--desktop::before,
	.mat-search--desktop::after {
    	background-color: rgba(255, 255, 255, .05);
	}
	@media only screen and (max-width: 782px) {
		.mat-search--desktop {
			display: none;
		}
		.mat-toolbar__section--end-icons {
			-webkit-box-flex: 0;
			-ms-flex: none;
			flex: none;
		}
	}
	@media only screen and (min-width : 782px) {
		.mat-search--mobile {
			display: none;
		}
	}
	.mat-search--desktop__wrapper {
		display: flex;
		height: 100%;
		width: 100%;
	}
	.mat-search--desktop:hover {
		background: rgba(255, 255, 255, .1);
	}
	.mat-search--desktop__input:focus {
		opacity: 1 !important;
	}
	.mat-search--desktop__content {
		margin-left: 16px;
		opacity: 0.7;
	}
	.mat-search--desktop__input {
		background-color: transparent;
		border: 0;
		outline: none;
		color: #fff;
		width: 100%;
		font-size: 14px;
	}
	.mat-search--desktop__icon {
		line-height: 42px;
		font-size: 22px;
		cursor: pointer;
	}
	.mat-search--desktop__input::-webkit-input-placeholder { /* WebKit, Blink, Edge */
		color: #fff;
	}
	.mat-search--desktop__input:-moz-placeholder { /* Mozilla Firefox 4 to 18 */
	   color: #fff;
	   opacity: 1;
	}
	.mat-search--desktop__input::-moz-placeholder { /* Mozilla Firefox 19+ */
	   color: #fff;
	   opacity: 1;
	}
	.mat-search--desktop__input:-ms-input-placeholder { /* Internet Explorer 10-11 */
	   color: #fff;
	}
	.mat-search--desktop__input::-ms-input-placeholder { /* Microsoft Edge */
	   color: #fff;
	}

	/*
		==============================
		  Search animation
		==============================
	*/
	@keyframes mat-toolbar--open-search {
	from {
		clip-path: circle(0 at calc(100% - var(--mat-toolbar--search-location)) 50%);
	}
	to {
		clip-path: circle(150% at calc(100% - var(--mat-toolbar--search-location)) 50%);
	}
	}
	@keyframes mat-toolbar--close-search {
		from {
			clip-path: circle(150% at calc(100% - var(--mat-toolbar--search-location)) 50%);
		}
		to {
			clip-path: circle(0 at calc(100% - var(--mat-toolbar--search-location)) 50%);
		}
	}
	
	/*
		==============================
		  Menu Component
		==============================
	*/
	.mdc-simple-menu {
		top: 6px;
		right: 6px;
	}
	
	/*
		==============================
		  MDC-WP Card Component
		==============================
	*/
	.mdcwp-card {
		background-color: #fff;
		border-radius: 2px;
	}
	.mdcwp-card__16-9-media {
        background-image: url("../images/16-9.jpg");
        background-size: cover;
        background-repeat: no-repeat;
        height: 12.313rem;
    }
	.mdcwp-card__adjust {
		max-width: calc(66.6666666667% - 16px);
		margin: 0 auto;
	}
	.mdcwp-card--with-avatar .mdc-card__meta {
        position: relative;
    }
    .mdcwp-card--with-avatar .mdcwp-card__avatar {
        position: absolute;
        background: #bdbdbd;
        height: 2.5rem; /* 40sp */
        width: 2.5rem; /* 40sp */
        border-radius: 50%;
    }
    .mdcwp-card--with-avatar .mdc-card__title-meta,
    .mdcwp-card--with-avatar .mdc-card__subtitle-meta {
        margin-left: 56px;
    }
	.mdc-card__meta a,
	.mdc-card__subtitle {
		text-decoration: none;
		color: #757575;
	}
	.mdc-card__primary:last-child {
		padding-bottom: 0;
	}
	.mdc-card__padding-adjust {
		padding-bottom: 0;
	}
	.mdcwp-edit-icon {
		color: Black;
		font-size: 16px;
		width: 16px;
		height: 18px;
		vertical-align: middle;
	}
	.mdc-card__supporting-text p {
		margin-bottom: 0;
		margin-top: 8px;
	}
	@media only screen and (max-device-width: 480px) {
		.mdcwp-card__adjust {
			max-width: calc(100% - 16px);
			margin: 0 auto;
		}
	}
	
	/*
		==============================
		  Toolbar Component
		==============================
	*/
	.logged-in .mdc-toolbar {
		top: 32px;
	}
	@media only screen and (max-device-width: 782px) {
		.logged-in .mdc-toolbar {
			top: 46px;
		}
	}

	/*
		==============================
		  MDC-WP Ribbon Page
		==============================
	*/
	.mdcwp-ribbon {
		width: 100%;
		height: 12rem;
		background-color: var(--mdc-theme-primary, #3f51b5);
		-webkit-flex-shrink: 0;
		-ms-flex-negative: 0;
		flex-shrink: 0;
		background-position: center;
		background-size: cover;
	}
	.mdcwp-ribbon__content {
		padding: 24px 32px;
	}
	@media only screen and (max-width : 782px) {
		.mdcwp-ribbon__content {
			padding: 16px 16px 0;
		}
		.mdc-card__supporting-text * {
			padding-left: 0;
			padding-right: 0;
		}
	}
	.mdcwp-ribbon__card {
		margin-top: -6.5rem;
	}
	
	/*
		==============================
		  MDC-WP Footer Component
		==============================
	*/
	.mdcwp-footer {
		padding: 16px 40px;
		color: #9e9e9e;
		background-color: #424242;
		margin-top: 1.2em;
	}
	.mdc-footer__link-list {
		list-style: none;
		padding: 0;
		display: flex;
	}
	.mdc-footer__link-list a {
		text-decoration: none;
		color: inherit;
		font-weight: 500;
	}
	.mdc-footer__widget a {
		text-decoration: none;
		color: inherit;
		font-weight: 500;
	}
	.mdc-footer__link-list li {
		margin-right: 16px;
		font-size: 14px;
	}
	.mdcwp-footer__bottom-section {
		margin-right: 30px;
	}
	
	/*
		==============================
		  Pagination
		==============================
	*/
	.mdcwp-older-posts-icon {
		color: Grey;
	}
	.mdcwp-pagination a {
		text-decoration: none;
	}
	.mdcwp-pagination__button {
		background-color: White;
	}
	
	/*
		==============================
		  404 error page
		==============================
	*/
	.searchform {
		height: 100%;
	}
	
	/*
		==============================
		  Comments section
		==============================
	*/
	.avatar {
		border-radius: 50%;
	}
	.comments-list {
		list-style: none;
		padding-left: 2px;
	}
	.children {
		list-style: none;
	}
	.mdc-button a,
	.logged-in-as a,
	.comment-reply-title a {
		text-decoration: none;
		color: Black;
	}
	.logged-in-as a:hover,
	.comment-reply-title a:hover {
		text-decoration: underline;
		color: Grey;
	}
	#cancel-comment-reply-link::before {
		content: 'close';
		font-family: 'Material Icons';
		font-weight: normal;
		font-style: normal;
		font-size: 24px;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		display: inline-block;
		white-space: nowrap;
		word-wrap: normal;
		direction: ltr;
		-webkit-font-feature-settings: 'liga';
		-webkit-font-smoothing: antialiased;
	}
	#cancel-comment-reply-link {
		display: table-caption;
		height: 24px;
		overflow: hidden;
		width: 24px;
		float: right;
	}
	.comment-reply-title a::before {
		content: '“';
	}
	.comment-reply-title a::after {
		content: '”';
	}
	.mdcwp-comment__title a {
		text-decoration: none;
	}
	.mdcwp-ripple-effect--edit {
		width: 36px;
		height: 36px;
	}
	#comment {
		width: 200px;
	}
	.mdcwp--comment {
		background-color: transparent;
		width: 100%;
	}
	.comment-edit-link {
		color: Black;
	}
	
	/*
		==============================
		  Tab Bar Component
		==============================
	*/
	@media only screen and (max-device-width: 480px) {
		.mat-tab-bar {width: 100%;}
	}
	.mat-toolbar--tab-bar__section {
		position: absolute;
		width: 100%;
		bottom: 0;
	}
	.mat-toolbar__row--tab-bar {
		padding: 0;
		min-height: 48px;
		transition: margin 300ms;
	}
	
	/*
		==============================
		  MDC-WP Progress Bar Component
		==============================
	*/
	.mdcwp-progressbar {
		visibility: visible;
		height: 100%;
		margin: 16px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	
	/*
		==============================
		  Immersive Mode
		==============================
	*/
	.mdcwp--immersive-mode .mdcwp-ribbon {
		position: fixed;
	}
	.mdcwp--immersive-mode main {
		position: sticky;
		padding-top: 12rem;
	}
	
	/*
		==============================
		  Content
		==============================
	*/
	.mat-toolbar-adjust {
		transition: margin 300ms;
	}
	
	/*
		==============================
		  Margin Animation
		==============================
	*/
	.mat-margin-animation {
		margin-top: -48px;
	}
