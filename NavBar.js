import React, { Component } from 'react';
import './NavBar.css';
import Axios from 'axios';

import { observer } from 'mobx-react';

import UserStore from '../../src/Stores/UserStore';

import APIkey from '../../src/Stores/APIkey';

class NavBar extends Component {
    constructor(props) {

        super(props);

        this.state = {
            query: '',
            results: {},
            loading: false,
            apiLoading: false,
            message: '',
            hasRun: false
        };
        this.cancel = '';
    }

    async componentDidMount() { 
        try{ //check if the user is logged in
            let res = await fetch('/isLoggedIn', { 
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            let result = await res.json();
    
            if (result && result.success) {
                UserStore.loading = false;
                UserStore.isLoggedIn = true;
                UserStore.username = result.username;
            }else{
                UserStore.loading = false;
                UserStore.isLoggedIn = false;
            }
        }
        catch(error){
            UserStore.loading = false;
            UserStore.isLoggedIn = false;
        }  
    }


    fetchSearchResults = (query) => {
        if(query.length < 2) return this.setState({results: []});
        
        const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${APIkey.keyThree}`;
        if(this.cancel){
            this.cancel.cancel();
        }
        this.cancel = Axios.CancelToken.source();
        Axios.get(searchUrl, {
            cancelToken: this.cancel.token
        }).then( res => {
            this.setState({
                results: res.data.bestMatches,
                loading: false
            })
        })
        .catch(error => {
            if(Axios.isCancel(error) || error) {
                this.setState({loading: false});
            }
        });
    };

    renderSearchResults = () => {
        const {results} = this.state;
        try{
            if(Object.keys(results).length && results.length){ 
                return (
                    <div className="results-container">
                        {results.map(result => {
                            var urlString = "/quote/"+result["1. symbol"]+"/"+result["2. name"];
                            return(
                                <div className="list">
                                    <a 
                                    key={result["2. name"]} 
                                    href={urlString} 
                                    className="results-item">
                                        {result["2. name"] +" ("+result["1. symbol"] +")"}
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                )
            }
        }catch(err){
            console.log(err);
        }
    };

    handleOnInputChange = ( event ) => {
        const query = event.target.value;
        this.setState({ query: query, loading: true, message: '' }, () => {
            this.fetchSearchResults(query);
        });
    };

    render () {
                
        const { query } = this.state;

        if(UserStore.loading) {
            return(
      
              <div>
                <p>Loading, please wait...</p>
              </div>
      
            );
        }else{            
            if(UserStore.isLoggedIn){
                let hrefString = '/account/' + UserStore.username;
                return(
                    <div className="navigation">
                        <div className="titles">
                            <a id="title" href="/"><h3>Stock Track</h3></a>
                            <a href="/marketoverview"> <i id="icon" className="fa fa-globe icon-2x"> </i></a>
                        </div>

                        <div className="container">
                            <label className="search-label">
                                <input type="text" id="search-input" placeholder="Search company or ticker" onChange={this.handleOnInputChange}></input>
                            </label>
                            {this.renderSearchResults()}
                        </div>

                        <div className="NavButtons">
                            <a href={hrefString}>My Account</a>
                            <a href="/lessons">Lessons</a> 
                        </div>
                    </div>
                );
            }else{
                return(
                    <div className="navigation">

                        <div className="titles">
                            <a id="title" href="/"><h3>Stock Track</h3></a>
                            <a href="/marketoverview"> <i id="icon" className="fa fa-globe icon-2x"> </i></a>
                        </div>

                        <div className="container">
                            <label className="search-label">
                                <input type="text" id="search-input" placeholder="Search company or ticker" onChange={this.handleOnInputChange}></input>
                            </label>
                            {this.renderSearchResults()}
                        </div>

                        <div className="NavButtons">
                            <a href="/register">Register</a>
                            <a href="/login">Login</a>
                            <a href="/lessons">Lessons</a>
                        </div>
                    </div>
                )
            }
        }
        
    }
}


export default observer(NavBar);