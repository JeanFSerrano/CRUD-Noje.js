const express = require('express')
const app = express()
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const session = require('express-session')
const mysql = require('mysql')

const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: 'password',
    database: 'node'
})

const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }))

app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'main'
}))

app.use(session({
    secret: 'rowlis',
    resave: false,
    saveUninitialized: true
}))

app.set('view engine', 'hbs')

app.listen(PORT, (req, res) => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
})

app.get('/', (req, res) => {

    if (req.session.errors) {
        let arrayErros = req.session.errors
        req.session.errors = ''
        return res.render('index', { NavActiveCad: true, error: arrayErros })
    }

    if (req.session.success) {
        req.session.success = false
        return res.render('index', { NavActiveCad: true, MsgSuccess: true })
    }
    res.render('index', { NavActiveCad: true })
})

app.get('/users', (req, res) => {

    db.query(
        'SELECT * FROM data', (err, result) => {
            if (err) {
                console.log(err)
            }

            if (result.length > 0) {
                return res.render('users', {
                    NavActiveUsers: true, table: true, users: result.map(user => user)
                })
            } else {
                return res.render('users', {
                    NavActiveUsers: true, table: false

                })
            }
        })
})

app.post('/cad', (req, res) => {
    let name = req.body.name
    let email = req.body.email
    const erros = []

    name = name.trim()
    email = email.trim()

    name = name.replace(/[^A-zÀ-ú\s]/gi, '')
    name = name.trim()

    if (name === '' || typeof name === undefined || typeof name === null) {
        erros.push({ mensagem: 'Preencha o nome corretamente.' })
    }

    if (!/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ\s]+$/.test(name)) {
        erros.push({ mensagem: 'O nome só pode conter letras.' })
    }

    if (email === '' || typeof email === undefined || typeof email === null) {
        erros.push({ mensagem: 'Preencha o email corretamente.' })
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        erros.push({ mensagem: 'Digite um email válido.' })
    }

    if (erros.length > 0) {
        console.log(erros)
        req.session.errors = erros
        req.session.success = false
        return res.redirect('/')
    }

    db.query(
        'INSERT INTO data (name, email) VALUES (?,?)', [name, email], (err, result) => {
            if (err) {
                console.log(err);
            }
            console.log('Valores inseridos');
        }
    )

    console.log('Validação realizada com sucesso!')
    req.session.success = true
    return res.redirect('/')

})

app.post('/list-edit', (req, res) => {
    const id = req.body.id

    db.query(
        'SELECT * FROM data WHERE id=?', [id], (err, result) => {

            if (err) {
                console.log(err)
                return res.render('edit', { error: true, msg: 'Não foi possível visualizar o registro.' })
            }

            return res.render('edit',
                { error: false, id: result[0].id, name: result[0].name, email: result[0].email })
        }
    )
})

app.post('/edit', (req, res) => {
    const id = req.body.id
    let name = req.body.name
    let email = req.body.email
    const erros = []

    name = name.trim()
    email = email.trim()

    name = name.replace(/[^A-zÀ-ú\s]/gi, '')
    name = name.trim()

    if (name === '' || typeof name === undefined || typeof name === null) {
        erros.push({ mensagem: 'Preencha nome corretamente.' })
    }

    if (!/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ\s]+$/.test(name)) {
        erros.push({ mensagem: 'O nome só pode conter letras.' })
    }

    if (email === '' || typeof email === undefined || typeof email === null) {
        erros.push({ mensagem: 'Preencha o email corretamente.' })
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        erros.push({ mensagem: 'Digite um email válido.' })
    }

    if (erros.length > 0) {
        console.log(erros)
        return res.status(404).send({ status: 400, erro: erros })
    }

    db.query(
        'UPDATE data SET name=?, email=? WHERE id=?', [name, email, id], (err, result) => {
            if (err) {
                console.log(err)
            }
        }
    )

    console.log('Edição realizada com sucesso!')
    console.log(name, email)
    req.session.success = true
    return res.redirect('/users')

})

app.post('/del', (req, res) => {
    let id = req.body.id

    db.query('DELETE FROM data WHERE id=?', [id], (err, result) => {

        if (err) {
            console.log(err);
        }
        return res.redirect('/users')
    })
})
