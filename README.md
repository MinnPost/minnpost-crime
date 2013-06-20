# MinnPost Crime

An application that explores crime in Minnesota.

## Install

1. For data processing and deploying: `npm install`
1. To view application: `bower install`

## Development

You should utilize the `index-src.html` file to do development.  This application uses SASS so utilizing `grunt watch` to compile SASS on the fly is recommended.

## Build

1. `grunt`

## Deploy (for MinnPost)

1. `grunt && grunt mp-deploy`

## Data processing

1. To turn MN Compass neighborhood profile data to JSON: `node data-processing/mncompass-2010-xlsx-json.js`
1. Create final Minneapolis neighborhood data JSON:
    1. Run: `node data-processing/minneapolis-neighborhoods.js`

## Data

### Minneapolis

#### Crime

* [Scraper of Minneapolis Monthly Reports](https://scraperwiki.com/scrapers/minneapolis_aggregate_crime_data/).  Original reports can be found on the [MPD stats page](http://www.minneapolismn.gov/police/statistics/crime-statistics_codefor_statistics).  These reports are very similar to the FBI Uniform Crime Reports, except that they use the date of the offense (not reported date) and count each offense of the report (not the worse offense) [see details](http://www.minneapolismn.gov/police/statistics/police_crime-statistics_understanding-codefor).

#### Demographics

* [MN Compass](http://www.mncompass.org/twincities/neighborhoods.php) has a [zipped Excel file of demographic data for Twin Cities neighborhoods](http://www.mncompass.org/_data/neighborhood-profiles/mnc-2011-neighborhood-profiles-alldata-no-suppression-r2.zip) that is downloaded here for processing.  This is mostly 2010 population data with 2005-2009 employment and related data.
* The City of Minneapolis has a [2000 race and ethnicity report](http://www.ci.minneapolis.mn.us/census/2000/census_2000-race-and-ethnicity-by-neighborhood).  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhood_census_population_2000/) has been made.

#### Neighborhoods

* [Definitive list of Minneapolis Neighborhoods](http://www.minneapolismn.gov/maps/neighborhoods) last updated 2006-01-01.  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhoods/) has been made.  Downloaded locally (```data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json```).  These contain keys that should be used throughout the application.
   * Download JSON with this command, though this data should not change anytime soon: `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=json&name=minneapolis_neighborhoods&query=select%20*%20from%20%60swdata%60"`
   * Download CSV: `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.csv "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=csv&name=minneapolis_neighborhoods&query=select%20*%20from%20%60swdata%60"`
* Downloaded shapefile of the neighborhoods was provided by the [City of Minneapolis](http://www.minneapolismn.gov/maps/about_maps_public-maps-links): `wget -O data/neighborhoods/minneapolis/minneapolis-neighborhoods.shp.zip "http://www.minneapolismn.gov/www/groups/public/@bis/documents/webcontent/wcms1p-106980.zip"`.  This was extracted with: `cd data/neighborhoods/minneapolis/ && unzip minneapolis-neighborhoods.shpfile.zip -d minneapolis-neighborhoods.shpfile; cd -;`
   * This has been converted to a GeojSON file with: `ogr2ogr -f "GeoJSON" data/neighborhoods/minneapolis/minneapolis-neighborhoods.geo.json data/neighborhoods/minneapolis/minneapolis-neighborhoods.shpfile/NEIGHBORHOODS.shp -t_srs "EPSG:4326"`

## Hacks

* Currently using custom version of Backbone.stickit, see [pull request](https://github.com/NYTimes/backbone.stickit/pull/122).