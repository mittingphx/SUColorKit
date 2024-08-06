# Scott's Utility Color Kit

<img src="images/color-picker-logo.png" align="right" 
  alt="Color Kollector logo by Scott Mitting" 
  width="150" height="150" />

The color kit is a Google Chrome Extension for both choosing colors 
and performing conversions between RGB, HSV, and Hex directly in the browser.
A variety of tools are available within the extension:

* Choosing colors from RGB and HSV sliders
* 2D gradients against a third value (e.g. Sat/Val over Hue) similar to Photoshop and other apps
* Named list of color palettes such as Web Safe and Pantone colors
* Choosing colors from uploaded images
* Eyedropper tool for grabing colors from webpages (coming soon)
* User ability to upload files to provide their own color palettes
* Output as hex color (and other CSS color types coming soon)

This can be installed direction from the Chrome Web Store at <a href="https://chromewebstore.google.com/detail/mjanmgobclmdijifofclpknmojoaodcj">https://chromewebstore.google.com/detail/mjanmgobclmdijifofclpknmojoaodcj</a>

<br><br>

<a href="https://buymeacoffee.com/scottmitting" target="_blank">Buy me a coffee.com</a>

<a href="https://ko-fi.com/N4N2113HUS" target="_blank">
     <img height="36" style="border:0;height:36px;" src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me a Coffee at ko-fi.com">
</a>

I could really use a dollar or two.


<br><br>

### Installation

This extension is currently under review to be placed in the Google Store for Extensions.  A link to that will be placed here once the app is accepted, which will be a much simpler installation process.  Until then, tagged releases are avaiable for download and manual installation:

* v0.9.3 - https://github.com/mittingphx/SUColorKit/releases/tag/v0.9.3

Instructions are listed within the tags on how to side-load extensions using the "Load Unpacked" feature.


### Screenshots

First screenshot shows off the photo color selector, allowing moving and zooming an image and clicking to select colors.

<img src="https://github.com/mittingphx/SUColorKit/blob/main/assets/screenshots/ColorKit-Screenshot-1.png" alt="Screenshot 1">

This screenshot shows a combine gradient selector and slider control view for picking a color.
In addition to traditional Sat/Val/Hue selection, classic palettes such as Nintendo or VGA-256 Colors are available. 

<img src="https://github.com/mittingphx/SUColorKit/blob/main/assets/screenshots/ColorKit-Screenshot-2.png" alt="Screenshot 2">

The next screenshots shows the lists of named colors you can choose from, which includes
industry standards such as Web-Safe Colors and Pantone, but also retro
video game and computer palettes such as early Macintosh and Windows 3.x.

<img src="https://github.com/mittingphx/SUColorKit/blob/main/assets/screenshots/ColorKit-Screenshot-3.png" alt="Screenshot 3">

The last screenshot shows the about screen from version v0.9.3 beta.

<img src="https://github.com/mittingphx/SUColorKit/blob/main/assets/screenshots/ColorKit-Screenshot-4.png" alt="Screenshot 4">



### Future Features

These features are planned to be released soon:

* Eyedropper tool for web pages
* Automatic detection of colors used on web pages into a list
* Drag-select multiple colors from a photo
* Organizing custom palette sets
* Import/export internal file system for backups and sharing custom color sets with friends
* CSS gradient generator (maybe?)
* Tools for picking complementary colors


### Source Code Organization

* assets/ - third-party styles and libraries
* css/ - stylesheets
* data/ - built-in json data
* images/ - built-in image data 
* js/ - code root
* js/fs/ - virtual file system code
* js/tabs/ - tab views
* js/util/ - helper methods

