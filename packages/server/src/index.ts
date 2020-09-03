import app from './App';

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
    console.log('Express server started on port: ' + port);
});
