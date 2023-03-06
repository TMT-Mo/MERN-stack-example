const API_KEY = 'AIzaSyC8OKmxA-zAHwLMfWUs8dAxOkLzk37G_Qo'
const axios = require('axios')
const HttpError = require('../models/http-error')
const mongoose = require('mongoose')
async function getCoordsForAddress(address){
    return {
        lat: 40.7484474,
        lng: -73.987156
    }
    // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)},+Mountain+View,+CA&key=${API_KEY}`)

    // const {data} = response
    // if(!data || data.status === 'ZERO_RESULTS'){
    //     const error = new HttpError('Could not find location', 422)
    //     throw error
    // }
    // const coordinates = data.results[0].geometry.location;
    // return coordinates
}

module.exports = getCoordsForAddress
