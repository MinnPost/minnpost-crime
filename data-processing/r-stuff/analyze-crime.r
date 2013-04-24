#Load the CSV with 2010 crime totals by neighborhood into a dataframe
tencrime <- read.csv("2010-crime.csv",header=TRUE)

#Load the demographic data into a dataframe
demog <- read.csv("MNC2_2011_NeighborhoodProfiles_AllData_NoSuppressionR2.csv",header=TRUE)

#Merge demographic and crime data on neighborhood name
agg <- merge(tencrime, demog, by.x="neighborhood",by.y="Neighborhood")

#Convert total population column to a number
agg$Total_Population <- as.numeric(agg$Total_Population)

#Convert median rent column to numbers by subbing out dollar signs and commas
agg$Median_rent_.2009_dollars. <- as.numeric(sub(",","",sub("\\$","", agg$Median_rent_.2009_dollars.)))

#Example plot stuff
#plot(agg$Median_rent_.2009_dollars.,agg$larceny/agg$Total_Population,ylab="Larceny per capita",xlab="Median rent")
#text(agg$Median_rent_.2009_dollars.,agg$larceny/agg$Total_Population,labels=agg$neighborhood,cex=.5)