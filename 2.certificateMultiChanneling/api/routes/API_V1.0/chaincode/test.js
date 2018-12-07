var express = require('express');
var router = express.Router();

var query = require('../../../utils/query')
var invoke = require('../../../utils/invoke')


router.get('/', async (req, res) => {
    let { data } = req.query


    let args = [data]
    let func = "query"
	
	try{
		let data = await query({args: args, func:func})
		return res.json(data)
	} catch (err) {
		return res.status(500).json(err)
	}
})

router.post('/',  async(req, res) => {
	let { 
		data1, data2, data3
	} = req.body
	console.log(data1, data2, data3)


	let func = "invoke"
	let args = [data1, data2, data3]

    try{
        let tx = await invoke({func: func, args: args})
		return res.status(201).json(tx)
    } catch(err) {
        return res.status(500).json(err)
    }

})

module.exports = router;
