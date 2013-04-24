#Load the CSV with 2010 crime totals by neighborhood into a dataframe
tencrime <- read.csv("2010-crime.csv",header=TRUE)

#Load the demographic data into a dataframe
demog <- read.csv("MNC3_2011_NeighborhoodProfiles_AllData_NoSuppressionR2.csv",header=TRUE,stringsAsFactors=FALSE)

#Merge demographic and crime data on neighborhood name
agg <- merge(tencrime, demog, by.x="neighborhood",by.y="Neighborhood")

#Example plot stuff
#plot(agg$Median_rent_.2009_dollars.,agg$larceny/agg$Total_Population,ylab="Larceny per capita",xlab="Median rent")
#text(agg$Median_rent_.2009_dollars.,agg$larceny/agg$Total_Population,labels=agg$neighborhood,cex=.5)

#Example correlations
#cor((agg$Total_Population/agg$Occupied_Housing_Units),agg$aggassault,use="complete.obs")

#Options for outputting a file with a table of correlations. Latter produces most complete data
#write.table(cor(agg[sapply(agg,is.numeric)],use="everything",method="spearman"),file="cors.csv")
#write.table(cor(agg[sapply(agg,is.numeric)],use="pairwise.complete.obs",method="pearson"),file="cors2.csv")