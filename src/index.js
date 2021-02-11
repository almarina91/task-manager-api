const express = require('express');
const app = express();

const port = process.env.PORT;

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

// ovako konektujes mongoose na bazu, pokreces ovaj fajl
require('./db/mongoose');

// da sam konvertuje objekte u json
app.use(express.json());

//da dohvati rute iz fajlova odvojenih
app.use(userRouter);
app.use(taskRouter);

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}!`);
});

