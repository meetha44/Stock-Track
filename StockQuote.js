import React, { Component } from 'react';
import './StockQuote.css';
import NavBar from "../components/NavBar.js";
import CanvasJSReact from './canvasjs.react';
import UserStore from '../../src/Stores/UserStore';
import { observer } from 'mobx-react';

import APIkey from '../../src/Stores/APIkey';

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

class StockQuote extends Component{

    constructor(props) {
        super(props);
        this.state = {
            ticker: props.match.params.ticker,
            companyName : props.match.params.companyName,
            StockInfo: {},
            timePeriod: "Time Series (Daily)",
            chartData: [],
            chartSetting: "None",
            fetching: true,
            firstLoad: true,
            dataObject: [],
            username: '',
            stockSaved: false
        };    
    }

    dailyCharts = () => {

        if(this.state.chartSetting == "Daily"){ //chart setting already on daily so do nothing (essentially disabling the button)
          return null;
        }
    
        try {
          document.getElementById("daily_button").style.background="black";
          document.getElementById("daily_button").style.color="white";
    
          document.getElementById("monthly_button").style.background="white";
          document.getElementById("monthly_button").style.color="black";
          
          document.getElementById("max_button").style.background="white";
          document.getElementById("max_button").style.color="black";
        }catch(e){
          console.warn(e);
        }
    
        this.state.timePeriod = "Time Series (Daily)";
        this.state.chartSetting = "Daily";
    
        const searchUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${this.state.ticker}&outputsize=compact&apikey=${APIkey.keyThree}`;
    
        this.fetchData(searchUrl);
    
        this.state.chartSetting = "Daily";
    
    };
    
    
    monthlyCharts = () => { //to monthly (last 12 months)

    if(this.state.chartSetting == "Monthly"){ //chart setting already on monthly so do nothing (essentially disabling the button)
        return null;
    }

    try {
        document.getElementById("monthly_button").style.background="black";
        document.getElementById("monthly_button").style.color="white";

        document.getElementById("daily_button").style.background="white";
        document.getElementById("daily_button").style.color="black";

        document.getElementById("max_button").style.background="white";
        document.getElementById("max_button").style.color="black";
    }catch(e){
        console.warn(e);
    }

    this.state.timePeriod = "Monthly Adjusted Time Series";
    this.state.chartSetting = "Monthly";

    const searchUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${this.state.ticker}&outputsize=compact&apikey=${APIkey.keyTwo}`;

    this.fetchData(searchUrl);

    };
        
    //max button setting
    
    maxCharts = () => {

    if(this.state.chartSetting == "Max"){ //chart setting already on max so do nothing (essentially disabling the button)
        return null;
    }

    try {
        document.getElementById("daily_button").style.background="white";
        document.getElementById("daily_button").style.color="black";

        document.getElementById("monthly_button").style.background="white";
        document.getElementById("monthly_button").style.color="black";

        document.getElementById("max_button").style.background="black";
        document.getElementById("max_button").style.color="white";
    }catch(e){
        console.warn(e);
    }

    this.state.timePeriod = "Monthly Adjusted Time Series";
    this.state.chartSetting = "Max";

    const searchUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${this.state.ticker}&outputsize=full&apikey=${APIkey.keyOne}`;

    this.fetchData(searchUrl);

    };
    
    fetchData = (searchUrl) => {

        var count = 0;
        if(this.state.chartSetting === "Daily" || this.state.chartSetting === "None"){
            count = 5
        }else if(this.state.chartSetting === "Monthly"){
            count = 12
        }

        fetch(searchUrl)
        .then(res => res.json())
        .then((data) => {
            this.state.dataObject = []; //reset the object 
            this.setState({ StockInfo: data })

            if(this.state.chartSetting === "Max"){
                count = Object.keys(data[this.state.timePeriod]).length;
                this.chart.options.axisX.valueFormatString = "MMMM YYYY";
            }

            var newerPrice = 0;
            var olderPrice = 0;

            for(let n = count-1; n > 0; n-- ){
                var date = Object.keys(data[this.state.timePeriod])[n];
                var open = parseFloat(data[this.state.timePeriod][date]["1. open"]);
                var high = parseFloat(data[this.state.timePeriod][date]["2. high"]);
                var low = parseFloat(data[this.state.timePeriod][date]["3. low"]);
                var close = parseFloat(data[this.state.timePeriod][date]["4. close"]);
                var newPrices = [open, high, low, close];
                newerPrice = close;
                var candleColor = "Green";
                if(newerPrice <= olderPrice){
                    candleColor = "Red";
                }

                olderPrice = newerPrice;
                this.state.dataObject.push({x: new Date(date), y: newPrices, color: candleColor });

            }

            this.chart.render();

        })
        .catch((err)=>console.log(err))


        this.state.fetching = false;
    }

    favourite() { //decides what icon to show (if any) whether stock is saved to the user's account

        if(UserStore.isLoggedIn){
            if(this.state.stockSaved){
                return(
                    <div className="buttonContainer">
                        <a id="saveOrDeleteButton" onClick={() => this.deleteTickerFunction()}>Delete</a>
                    </div>
                );
            }else{
                return(
                    <div className="buttonContainer">
                        <a id="saveOrDeleteButton" onClick={() => this.saveTicker()}>Save</a>
                    </div>
                );
            }
        }
    }

    async saveTicker(){

        if(!UserStore.isLoggedIn){
            alert("Login to save stocks");
        }

        try{
            let res = await fetch('/saveTicker', {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: this.state.ticker,
                })
            });

            let result = await res.json();
            
            if (result && result.success) {
                alert("Stock saved");
                
            }
        
        }catch(error){
            alert("error");
        }
    }

    async deleteTickerFunction() {
        let tickersString = '';
        try{
            let res = await fetch('/getSavedStocks', {
                method: 'post',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
            });

            let result = await res.json();

            if (result && result.success) { //user has saved stocks

                let tickerArray = result.savedTickers.split(",");
                let index = tickerArray.indexOf(this.state.ticker);

                tickerArray.splice(index, 1);
                tickersString = tickerArray.toString();

            }

        }catch (error){
            console.log(error);

        }

        try{
            let res = await fetch('/deleteTicker', {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tickers: tickersString,
                })
            });

            let result = await res.json();

            if (result && result.success) {
                alert("Stock deleted");
            }
        
        }catch(err){
            alert("Error, please try again");
        }

        this.render();

    }

    async componentDidMount() {
        try {
            let res = await fetch('/isLoggedIn', {  //Initial API call to check if the user is logged in
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            let result = await res.json();
      
            if (result && result.success) {
                this.state.apiLoading = false;

                UserStore.loading = false;
                UserStore.isLoggedIn = true;
                UserStore.username = result.username;
            }else{
                this.state.loading = false;

                UserStore.loading = false;
                UserStore.isLoggedIn = false;
            }
      
        }catch(error){
            UserStore.loading = false;
            UserStore.isLoggedIn = false;
            alert("Error, try again");
        }

        if(UserStore.isLoggedIn){
            try{ //check if user is logged in first (get the username)
                let res = await fetch('/getSavedStocks', {
                    method: 'post',
                    headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: UserStore.username,
                    })
                });
    
                let result = await res.json();
    
                if (result && result.success) { //user has saved stocks
    
                    var tickerArray = result.savedTickers.split(",");
                    
                    //check for ticker in the array
                    if(tickerArray.includes(this.state.ticker)) {
                        this.state.stockSaved = true;
                        
                    }
    
                }
    
            }catch (error){
                console.log(error);
            }
        }
    }

    render(){        
        if (!this.state.StockInfo) {
            return null;
        }
      
        if(this.state.fetching === true){
            if(this.state.chartSetting === "Daily" || "None"){
                this.dailyCharts();
            }else if(this.state.chartSetting === "Monthly"){
                this.monthlyCharts()
            
            }else{
                this.maxCharts()
            }
        
        }

        //check if stock is added to the account

        const options = {
            theme: "light2", // "light1", "light2", "dark1", "dark2"
            animationEnabled: true,
            exportEnabled: true,
            zoomEnabled: true,
            
            title:{
              margin: 100,
              fontSize: 25,
              text: this.state.ticker,
              color: "black",
              fontFamily: "poppins"
            },
            axisX: {
                valueFormatString: "DD MMMM",
                fontFamily: "poppins"
            },
            axisY: {
                includeZero:false,
                title: "Price (in USD)",
                includeZero:false,
                fontFamily: "poppins"
            },
      
            data: [{
                type: "candlestick",
                fontFamily: "poppins",
                showInLegend: true,
                color: "white",
                name: this.state.companyName,
                yValueFormatString: "$###0.00",
                xValueFormatString: "DD MMMM",
                dataPoints: this.state.dataObject
            }]
        }
        
        return (
      
            <div className="graph">
                <NavBar id="#navBar"></NavBar>

                <h2>{this.state.companyName}</h2>

                {/* Creates a div with the chart setting buttons */}
                <div className="graphSettings"> 
                    <a id="daily_button" onClick={this.dailyCharts}>Daily</a>
                    <a id="monthly_button" onClick={this.monthlyCharts}>Monthly</a>
                    <a id="max_button" onClick={this.maxCharts}>Max</a>
                </div>
      
                <div>
                    <CanvasJSChart options = {options}
                    onRef={ref => this.chart = ref}
                    />
                </div>

                {this.favourite()}
              
            </div>
          );
    }
}


export default observer(StockQuote);