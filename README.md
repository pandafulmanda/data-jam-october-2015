# About

October [data jam](http://www.meetup.com/Houston-Data-Visualization-Meetup/events/226018977/) with Houston housing data

# Technologies used

Goal was to keep this front-end only so as to keep things simple.  These are listed roughly in the order they are used or were added to the code base.

1. [csvtojson](https://www.npmjs.com/package/csvtojson)
  * CSV to JSON from commandline
1. [jQuery](http://api.jquery.com/jquery.getjson/)
  * To GET from staticly served JSON files
1. [lodash](https://lodash.com/docs)
  * Data shaping
  * Utility, functional stuffs, basically...for everything.
1. [ChartJS](http://www.chartjs.org/docs/#bar-chart)
  * For plotting
  * Quick to get up and running
1. [underscore.string](http://epeli.github.io/underscore.string/)
  * To transfrom ALL CAPS subdivision labels to be Titleized
1. [Color Brewer](http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=4)
  * Made the plot more readable
1. [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
  * To cache processed data on first load

# Demo
![Browsing by Subdivision](http://pandafulmanda.github.io/data-jam-october-2015/assets/browsing-by-subs.gif)

# Data set features

### Amortized Years
How long the loan is - many are 30 years

### AnnualMainDesc
Is there a mandatory maintainance organization Yes or No

### AnnualMainfee
How much os the yearly maintaince fee?

### Bath
Ignore

### Bathsfull
how many full baths does house have

### bathshalf
How many 1/2 baths does the house have

### Countertops
What countertops does the house have (granite may indicate higher value)

### daysonmarket
How many days did it take to sell

### Defects
Known defects may indicate problems with the house - known defects should be linked to lower value

### Floors
What type of floor - real wood is better than laminate

### Foundation
Slab mostly - house is on a slab foundation

### garagecap
How many cars can fit int he garage

### GPEXT_LONGITUDE and LATITUDE
Lat and long for the property

### LEGALSUBDIVISION
Highly significant - what subdivision is the house in - very significant

### Listprice
Beginning asking price

### Loanamountnew
How much was borrowed to buy the hoiusse

### loaninterestrate
Interest rate on loan

### lossmitigation
Is the sale under terms of distress - motivated seller?

### lotsize
Lot size

### newconstruction
Is the house new construction or not?

### pricesqftlist
List price of house by square footage

### PRICESQFTSOLD
Sold price per square foot

### realremarks
private agent instructions or comments

### Remarks
Public agent comments meant for everyone to see

### repairsller
Is seller contributing to the repairs for the house - may indicate distress

### salesprice
sales price

### schooldistrict
School District

### SECNUM
Section number of the subdivision - may have some correlation to value

### SQFTBLDG
SQUARE FOOTAGE OF THE BUILDING

### Stories
how many stories the house has

### STYLE
construction style
