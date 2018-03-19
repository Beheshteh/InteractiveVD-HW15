

# Use Flask to design an API for your dataset and to serve the HTML and JavaScript
#required for your dashboard page. Note: We recommend using the sqlite database file
#and SQLAlchemy inside of your Flask application code, but you are permitted to read 
#the CSV data directly into Pandas DataFrames for this assignment. You will still need
#to output the data as JSON in the format specified in the routes below.


#########################################################
# import necessary dependency

# Flask (Server)
from flask import Flask, jsonify, render_template, request, flash, redirect

# SQL Alchemy (ORM)
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, desc,select

import pandas as pd
import numpy as np



# Database Setup

engine = create_engine("sqlite:///DataSets/belly_button_biodiversity.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(engine, reflect=True)

# Save reference to the tables in database
OTU = Base.classes.otu
Samples = Base.classes.samples
Samples_Metadata= Base.classes.samples_metadata


session = Session(engine)

app = Flask(__name__)


# Flask Routes
#################################################

#route("/")
# Returns the dashboard homepage
@app.route("/")
def index():
    return render_template("index.html")

#route('/names')
# Returns a list of sample names
@app.route('/names')
def names():
    """Return a list of sample names."""
    sample = session.query(Samples).statement
    df = pd.read_sql_query(sample, session.bind)
    df.set_index('otu_id', inplace=True)
        
    return jsonify(list(df.columns))

#route('/otu')
#Returns a list of OTU descriptions in the following format

   # [
     #   "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
     #   "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
      #  "Bacteria",
      #  "Bacteria",
      #  "Bacteria",
     #   ...
   # ]
   # """
@app.route('/otu')
def otu():
    """Return a list of OTU descriptions."""
    results = session.query(OTU.lowest_taxonomic_unit_found).all()

    # Use numpy ravel to extract list of tuples into a list of OTU descriptions
    otu_list = list(np.ravel(results))
    return jsonify(otu_list)

#route('/metadata/<sample>')
#MetaData for a given sample.
#Args: Sample in the format: `BB_940`

#Returns a json dictionary of sample metadata in the format

  #  {
   #     AGE: 24,
     #   BBTYPE: "I",
      #  ETHNICITY: "Caucasian",
     #  GENDER: "F",
      #  LOCATION: "Beaufort/NC",
     #   SAMPLEID: 940
   # }

@app.route('/metadata/<sample>')
def sample_metadata(sample):
    """Return the MetaData for a given sample."""
    sel = [Samples_Metadata.SAMPLEID, Samples_Metadata.ETHNICITY,
           Samples_Metadata.GENDER, Samples_Metadata.AGE,
           Samples_Metadata.LOCATION, Samples_Metadata.BBTYPE]

    # sample[3:] strips the `BB_` prefix from the sample name to match
    # the numeric value of `SAMPLEID` from the database
    results = session.query(*sel).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()

    # Create a dictionary entry for each row of metadata information
    sample_metadata = {}
    for result in results:
        sample_metadata['SAMPLEID'] = result[0]
        sample_metadata['ETHNICITY'] = result[1]
        sample_metadata['GENDER'] = result[2]
        sample_metadata['AGE'] = result[3]
        sample_metadata['LOCATION'] = result[4]
        sample_metadata['BBTYPE'] = result[5]

    return jsonify(sample_metadata) 
  
    
#route('/wfreq/<sample>')

 #   """Weekly Washing Frequency as a number.
 #  Args: Sample in the format: `BB_940`
 # Returns an integer value for the weekly washing frequency `WFREQ`

@app.route('/wfreq/<sample>')
def sample_wfreq(sample):
    """Return the Weekly Washing Frequency as a number."""

    # `sample[3:]` strips the `BB_` prefix
    results = session.query(Samples_Metadata.WFREQ).\
        filter(Samples_Metadata.SAMPLEID == sample[3:]).all()
    wfreq = np.ravel(results)

    # Return only the first integer value for washing frequency
    return jsonify(int(wfreq[0]))


#route('/samples/<sample>')
# Return a list of dictionaries containing sorted lists  for `otu_ids`and `sample_values`

@app.route('/samples/<sample>')
def samples(sample):
    """Return a list dictionaries containing `otu_ids` and `sample_values`."""
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)

    # Make sure that the sample was found in the columns, else throw an error
    if sample not in df.columns:
        return jsonify(f"Error! Sample: {sample} Not Found!"), 400

    # Return any sample values greater than 1
    df = df[df[sample] > 1]

    # Sort the results by sample in descending order
    df = df.sort_values(by=sample, ascending=0)

    # Format the data to send as json
    data = [{
        "otu_ids": df[sample].index.values.tolist(),
        "sample_values": df[sample].values.tolist()
    }]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port = 5005)



