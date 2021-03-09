import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {validationResult } from 'express-validator'
import fs from 'fs'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"
interface DbSchema {
  users: User[]
}
interface User {
  username: string
  password: string
  firstname: string
  lastname: string
  balance: number
}
interface JWTPayload {
  username: string;
}
const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}

app.post('/login',
  (req, res) => {

    const { username, password } = req.body
    // Use username and password to create token.
    const db = readDbFile()
    const user = db.users.find(user => user.username === username)
  if (!user) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  const token = jwt.sign(
    {username} as JWTPayload,SECRET
  )
    return res.status(200).json({
      message: 'Login succesfully',
      token
    })
  })

app.post('/register',
  (req, res) => {
    const { username, password, firstname, lastname, balance } = req.body
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      res.status(400)
      res.json(errors)
      return
    }

    const db = readDbFile()
    if(db.users.find(user=>user.username === username)){
      return res.status(400).json({message:"Username is already in used"})
    }
    const hashPassword = bcrypt.hashSync(password, 10)
    db.users.push({
      username,
      password: hashPassword,
      firstname,
      lastname,
      balance
    })
    fs.writeFileSync('db.json', JSON.stringify(db,null,2))
    res.json({ message: 'Register complete' })
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const reqUser = db.users.find(user => user.username === username)
      res.status(200).json({name: reqUser?.firstname + " " + reqUser?.lastname,
                            balance: reqUser?.balance})
    }
    catch (e) {
      //response in case of invalid token
      res.status(401).json({
        message : "Invalid token"
      })
    }
  })

app.post('/deposit',
  (req, res) => {
    try{
      const {amount} = req.body
      const db = readDbFile()
      //Is amount <= 0 ?
      if (amount <= 0)
      return res.status(400).json({ message: "Invalid data" })

      const token: string = req.query.token as string
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const reqUser = db.users.find(user => user.username === username)
      if(reqUser){
        reqUser.balance = reqUser.balance + amount
        fs.writeFileSync("db.json", JSON.stringify(db,null,2))
        return res.status(200).json({
            message: "Deposit successfully",
            balance: reqUser?.balance 
        })
      }
      res.status(404).json({message:"USER NOT FOUND"})
    }catch(e){
      res.status(401).json({
        message : "Invalid token"
      })
    }
  })

app.post('/withdraw',
  (req, res) => {
    try{
      const {amount} = req.body
      const db = readDbFile()
      const token: string = req.query.token as string
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const reqUser = db.users.find(user => user.username === username)
      if(reqUser){
        if (amount <= 0 || reqUser.balance < amount)
          return res.status(400).json({ message: "Invalid data" })
        reqUser.balance = reqUser.balance - amount
        fs.writeFileSync("db.json", JSON.stringify(db,null,2))
        return res.status(200).json({
            message: "Withdraw successfully",
            balance: reqUser.balance 
        })
      }
      res.status(404).json({message:"USER NOT FOUND"})
    }catch(e){
      res.status(401).json({
        message : "Invalid token"
      })
    }
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  fs.writeFileSync("db.json" , JSON.stringify({users:[]},null,2))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  res.status(200).json({
    firstname: "Kamonpat",
    lastname: "Sunthonpong",
    code : 620610771,
    gpa : 3.39 
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))