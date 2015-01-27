# MinnPost Crime

An application that explores crime in Minnesota, specifically Minneapolis.  The live application can be found at [minnpost.com/crime](http://www.minnpost.com/crime).

## Updating data

Crime data comes from [monthly reports](http://www.minneapolismn.gov/police/statistics/crime-statistics_codefor_statistics) produced by the Minneapolis PD.  Due to the files being removed once, we upload the files to S3 so that we have our copy of the original data if needed.  We then use ScraperWiki to store the data for us.

1. Download newest Excel file from the [MPD site](http://www.minneapolismn.gov/police/statistics/crime-statistics_codefor_statistics).
1. Rename to `YYYY-MM.xlsx`, for example `2014-06.xlsx`.
1. Inspect Excel file and make sure the following.
    * The file is an `.xlsx` or `.xls` file.  Both can be handled, but the former needs to be noted in the Scraper entry.
    * The first tab is the month.  There will probably be other tabs for year-to-date, or quarterly data.
    * There are 10 columns, one for the neighborhood and the rest for stats.
    * There is only one line for the headers.  This can be handled in the scraper if needed as well.
    * There are no empty lines before the last line.  This can be handled in the scraper if needed as well.
1. Upload to [AWS S3](https://console.aws.amazon.com/s3/home?region=us-east-1) in the following location: `data.minnpost/projects/minnpost-crime/data-source/mpls-monthly-reports`
    1. Make the item **Public**.  This can be done by right-clicking the item and selecting `Make Public`.
    1. Use the `Properties` tab in the S3 interface to copy the URL to the new item.
1. Update the [crime data scraper on ScraperWiki](https://scraperwiki.com/dataset/bf2dlli/settings).
    1. Towards the end of the code, add an entry to the configuration dictionary.  It should look like the most recent one.  If some of the aspects (see above) of the file are not usual, you can provide some config for that; check out some of the older files.
        * `year`
        * `month`
        * `url`: This is the URL to the file on S3
        * `original`: This is not used at all and just for reference, but should be the URL to the file on the MPD site.
    1. Double check your code.
    1. Run the scraper.  It should only run the most recent entry that you added; if you run again, it will end up processing all the files and this will take some time.
    1. Check the output and make sure there are no errors (there may be a warning about HTTPS, but this seems to be fine)
1. Wait an hour or (optional) Clear the data proxy.  There is a [proxy on Heroku](https://dashboard.heroku.com/apps/all-good-proxy/) that caches some of the ScraperWiki data and protects against ScraperWiki going down (which only happened once).
    1. Make sure that you have access to the MinnPost Heroku account and have Heroku setup on your computer.
    1. Get the [proxy code from Github](https://github.com/MinnPost/all-good-proxy)
    1. Connect code to Heroku: `heroku git:remote -a all-good-proxy`
    1. Restart app: `heroku restart`
1. Check the dashboard

## Development and Install

### Perquisites

1. Install [Git](http://git-scm.com/).  On Mac with Homebrew: `brew install git`
1. Install [NodeJS](http://nodejs.org/).  On Mac with Homebrew: `brew install node`
1. Install [Grunt](http://gruntjs.com/): `npm install -g grunt-cli`
1. Install [Bower](http://bower.io/): `npm install -g bower`
1. Install [Sass](http://sass-lang.com/): `gem install sass`
1. Because Leaflet comes unbuilt, we need to build it with Jake: `npm install -g jake`

### Get the code

1. Clone the repository with something like: `git clone git@github.com:MinnPost/minnpost-crime.git`
1. Go into the code directory: `cd minnpost-crime`

### Install libraries

1. `npm install`
1. `bower install`
1. Because Leaflet comes unbuilt, we need to build it: `cd bower_components/leaflet/ && npm install && jake; cd -;`

### Run

1. Us grunt to watch files for changes and serve the files with: `grunt server-watch`
1. Go to [localhost:8899/index.html](http://localhost:8899/index.html) in your browser.

### Build

1. `grunt`

### Deploy

1. `grunt mp-deploy`

### Data processing

1. To turn MN Compass neighborhood profile data to JSON: `node data-processing/mncompass-2010-xlsx-json.js`
1. Create final Minneapolis neighborhood data JSON:
    1. Run: `node data-processing/minneapolis-neighborhoods.js`

## Data

### Minneapolis

#### Crime

* [Scraper of Minneapolis Monthly Reports](https://scraperwiki.com/scrapers/minneapolis_aggregate_crime_data/).  Original reports can be found on the [MPD stats page](http://www.minneapolismn.gov/police/statistics/crime-statistics_codefor_statistics).  These reports are very similar to the FBI Uniform Crime Reports, except that they use the date of the offense (not reported date) and count each offense of the report (not the worse offense) [see details](http://www.minneapolismn.gov/police/statistics/police_crime-statistics_understanding-codefor).
    * (not applicable anymore) Due to the fact that the MPD has decided not to release Excel files anymore.  This means that PDF's are manually parsed with Tabula and put into the `data/crime/mpls-monthly-reports-manual-folder`.  These are then uploaded to S3 and used in the scraper.
    * Run `node data-processing/download-mpls-monthly-reports.js` to download the existing Excel files locally.  Then do `grunt mp-source-data` to upload these files to S3.

#### Demographics

* [MN Compass](http://www.mncompass.org/twincities/neighborhoods.php) has a [zipped Excel file of demographic data for Twin Cities neighborhoods](http://www.mncompass.org/_data/neighborhood-profiles/mnc-2011-neighborhood-profiles-alldata-no-suppression-r2.zip) that is downloaded here for processing.  This is mostly 2010 population data with 2005-2009 employment and related data.
* The City of Minneapolis has a [2000 race and ethnicity report](http://www.ci.minneapolis.mn.us/census/2000/census_2000-race-and-ethnicity-by-neighborhood).  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhood_census_population_2000/) has been made.  Download with: `wget -O data/demographics/2000/minneapolis-demographics-2000.json "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=json&name=minneapolis_neighborhood_census_population_2000&query=select%20*%20from%20%60swdata%60"`
   * Note that in 2005, the Phillips neighborhood was split up into Ventura Village, Phillips West, Easy Phillips, and Midtown Phillips (see [neighborhood profile](http://www.minneapolismn.gov/ward6/neighborhoods/council_ward6_phillipswest)).  The 2000 population is taken from Wikipedia:
       * http://en.wikipedia.org/wiki/Phillips_West,_Minneapolis
       * http://en.wikipedia.org/wiki/Phillips_East,_Minneapolis
       * http://en.wikipedia.org/wiki/Ventura_Village,_Minneapolis
       * http://en.wikipedia.org/wiki/Midtown_Phillips,_Minneapolis

#### Neighborhoods

* [Definitive list of Minneapolis Neighborhoods](http://www.minneapolismn.gov/maps/neighborhoods) last updated 2006-01-01.  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhoods/) has been made.  Downloaded locally (```data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json```).  These contain keys that should be used throughout the application.
   * Download JSON with this command, though this data should not change anytime soon: `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=json&name=minneapolis_neighborhoods&query=select%20*%20from%20%60swdata%60"`
   * Download CSV: `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.csv "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=csv&name=minneapolis_neighborhoods&query=select%20*%20from%20%60swdata%60"`
* Downloaded shapefile of the neighborhoods was provided by the [City of Minneapolis](http://www.minneapolismn.gov/maps/about_maps_public-maps-links): `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods.shp.zip "http://www.minneapolismn.gov/www/groups/public/@bis/documents/webcontent/wcms1p-106980.zip"`.  This was extracted with: `cd data/neighborhoods/minneapolis/ && unzip minneapolis-neighborhoods.shpfile.zip -d minneapolis-neighborhoods.shpfile; cd -;`
   * This has been converted to a GeojSON file with: `ogr2ogr -f "GeoJSON" data/neighborhoods/minneapolis/minneapolis-neighborhoods.geo.json data/neighborhoods/minneapolis/minneapolis-neighborhoods.shpfile/NEIGHBORHOODS.shp -t_srs "EPSG:4326"`

## Hacks

* Currently using custom version of Backbone.stickit, see [pull request](https://github.com/NYTimes/backbone.stickit/pull/122).
