# Crime

## Data

### Minneapolis

#### Crime

* [Scraper of Minneapolis Monthly Reports](https://scraperwiki.com/scrapers/minneapolis_aggregate_crime_data/).  Original reports can be found on the [MPD stats page](http://www.minneapolismn.gov/police/statistics/crime-statistics_codefor_statistics).

#### Demographics

* [MN Compass](http://www.mncompass.org/twincities/neighborhoods.php) has a [zipped Excel file of demographic data for Twin Cities neighborhoods](http://www.mncompass.org/_data/neighborhood-profiles/mnc-2011-neighborhood-profiles-alldata-no-suppression-r2.zip) that is downloaded here for processing.  This is mostly 2010 population data with 2005-2009 employment and related data.
* The City of Minneapolis has a [2000 race and ethnicity report](http://www.ci.minneapolis.mn.us/census/2000/census_2000-race-and-ethnicity-by-neighborhood).  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhood_census_population_2000/) has been made.

#### Neighborhoods

* [Definitive list of Minneapolis Neighborhoods](http://www.minneapolismn.gov/maps/neighborhoods) last updated 2006-01-01.  A [scraper of this data](https://scraperwiki.com/scrapers/minneapolis_neighborhoods/) has been made.  Downloaded locally (```data/neighborhoods/minneapolis-neighborhoods-2012.json```).  These contain keys that should be used throughout the application.
   * Download with this command, though this data should not change anytime soon: ```wget -O data/neighborhoods/minneapolis-neighborhoods-2012.json "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=json&name=minneapolis_neighborhoods&query=select%20*%20from%20%60swdata%60" ```
* A geographical file of all Twin Cities neighborhoods was provided by [MN Compass](http://www.mncompass.org/) (via email).  Minneapolis wanted to charge $25 and have us sign an NDA.
   * The KMZ has been converted to a shapefile (```data/neighborhoods/twin-cities-neighborhoods-2012```) and then split into the two cities (```data/neighborhoods/minneapolis-neighborhoods-2012```) with QGIS.