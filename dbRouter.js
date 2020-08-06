const bcrypt = require('bcrypt');

class dbRouter {

    constructor(app, db) {
        
        this.login(app, db);
        this.logout(app, db);
        this.isLoggedIn(app, db);
        this.register(app, db);
        this.getSavedStocks(app, db);
        this.saveTicker(app, db);
        this.deleteTicker(app, db);

    }

    async login(app, db) { //creates login route
        app.post('/login', (req, res) => {
            let username = req.body.username
            let inputPassword = req.body.password
            username = username.toLowerCase();
            if(username.length > 24 || inputPassword.length > 24 || username.length < 4 || inputPassword.length < 4){ //validates inputs
                return res.json({
                    success: false,
                    msg: 'Username or password invalid'
                })
            }
            let sqlQuery = "SELECT * FROM users WHERE username = ? LIMIT 1";
            db.query(sqlQuery, [username], (err, data) => { //queries the database
                if(err){
                    return res.json({
                        success: false,
                        msg: 'Database error, please try again'
                    });
                }
                if(data && data.length === 1){ //found 1 user
                    bcrypt.compare(inputPassword, data[0].password, (bcryptErr, verified) => { //compares the passwords
                        if (verified){
                            req.session.userID = data[0].id;
                            return res.json({
                                success: true,
                                username: data[0].username,
                            });
                        }else{
                            return res.json({
                                success: false,
                                msg: 'Invalid username or password'
                            });
                        }
                    });
                }else{
                    return res.json({
                        success: false,
                        msg: 'User not found'
                    })
                }
            });
        });
    }

    logout(app, db) { //creates logout route

        app.post('/logout', (req,res) => {
            if(req.session.userID) {
                req.session.destroy(); //simply destorys the session
                res.json({
                    success: true,

                })
                return true;

            }else{
                res.json({
                    success: false
                })
                return false;
            }
        })

    }
    

    async register(app, db) { //register route

        app.post('/register', (req,res) => {
            let username = req.body.username
            let password = req.body.password

            username = username.toLowerCase();

            if(username.length > 24 || password.length > 24 || username.length < 4 || password.length < 4){ //validates inputs
                return res.json({
                    success: false,
                    msg: 'Username or password too long'
                })
            }

            db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username], (err, data) => { //check if username already exists
                if(err){
                    return res.json({
                        success: false,
                        msg: 'Error connecting to database, please try again'
                    });
                }else if(data.length){
                    return res.json({
                        success: false,
                        msg: 'User already exists'
                    }); 
                }else{ //if the user doesnt exists, this else function is run
                    let encryptedPassword = bcrypt.hashSync( password , 9 );
                    let inputArray = [username, encryptedPassword]; //encrypted password
                    db.query("INSERT INTO `users` (`id`, `username`, `password`, `saved_tickers`) VALUES (NULL, ?, ?, '') ", inputArray, (err, data) => {  //inserts the data to database
                        if(err){
                            console.warn(msg);
                            return res.json({
                                success: false,
                                msg: 'Error connecting to database, please try again'
                            });
                        }else{ //register is successful                            
                            return res.json({
                                success: true,
                            });
                        }
                    });
                }
            });
            return;
        });
    }


    
    isLoggedIn(app, db) { //this route is called when a page wants to know if the user is logged in
        app.post('/isLoggedIn', (req,res) => {
            if(req.session.userID) {
                let id = req.session.userID;
                db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id], (err, data) => { //checks if there exists a user with the session id in the database                 
                    if(data && data.length ===1){
                        return res.json({
                            success: true,
                            username: data[0].username
                        });
                    }else{
                        return res.json({
                            success: false
                        })
                    }
                })
            }else{
                return res.json({
                    success: false
                });
            }    
        });
    }


    getSavedStocks(app, db) { //creates route that returns the saved stocks
        app.post('/getSavedStocks', (req,res) => {
            if(req.session.userID) { //if a user is logged in
                let id = req.session.userID //get the username that was passed
                
                db.query('SELECT saved_tickers FROM users WHERE id = ?', [id], (err, data) => { //select the saved tickers that are saved on the database 
                    if(err){ //error handling
                        return res.json({
                            success: false,
                            msg: 'Database error'
                        });
                    }
                    if(data){ //return the saved tickers
                        return res.json({
                            success: true,
                            savedTickers: data[0].saved_tickers
                        });
                    }else{ //the user has not saved any stocks
                        return res.json({
                            success: false,
                            msg: 'No saved stocks'
                        });
                    }
                });
            }else{
                return res.json({
                    success: false,
                    msg: 'Error.'
                });
            }
        });

    }

    async saveTicker(app, db) { //function is called when a ticker wants to be saved

        app.post('/saveTicker', (req,res) => {
            let ticker= ` ${req.body.ticker}` //adds a space to the front of the string as the array is split by the checking for the gap
                let dbQuery = "UPDATE users SET saved_tickers = CONCAT(saved_tickers, ? ) WHERE id = ?";
                let dbVariables = [ticker , req.session.userID];
                db.query(dbQuery, dbVariables, (err, data) => { 
                    if(err){
                        console.log(err);
                        return res.json({
                            success: false,
                            msg: 'Database error'
                        })
                    }

                    return res.json({
                        success: true
                    });
                });
        });        
        
    }

    deleteTicker(app, db){

        app.post('/deleteTicker', (req,res) => {
            let tickers= `${req.body.tickers}` 
            if(req.session.userID) {//if the user is logged in
                let dbVariables = [tickers , req.session.userID];
                db.query("UPDATE users SET saved_tickers = ? WHERE id = ?", dbVariables, (err, data) => { // '?'
                    if(err){

                        return res.json({
                            success: false,
                            msg: 'Database error'
                        })
                    }

                    return res.json({
                        success: true
                    });
                });
            }else{
                return res.json({
                    success: false
                });
            }
        })
    }

}

module.exports = dbRouter;