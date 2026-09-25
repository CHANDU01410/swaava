
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setCurrentAddress, setCurrentCity, setCurrentState } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

function useGetCity() {
    const dispatch = useDispatch()
    const apiKey = import.meta.env.VITE_GEOAPIKEY

    useEffect(() => {
        // Run geolocation in background - don't block app loading
        // Use a small timeout to ensure app renders first
        const timeoutId = setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude
                    const longitude = position.coords.longitude
                    dispatch(setLocation({ lat: latitude, lon: longitude }))

                    try {
                        const result = await axios.get(
                            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
                        )
                        const data = result?.data?.results?.[0]
                        if (data) {
                            dispatch(setCurrentCity(data.city || data.county))
                            dispatch(setCurrentState(data.state))
                            dispatch(setCurrentAddress(data.address_line2 || data.address_line1))
                            dispatch(setAddress(data.address_line2))
                        }
                    } catch (error) {
                        console.log('Geolocation API error:', error)
                    }
                },
                (error) => {
                    console.log('Geolocation permission denied or unavailable:', error)
                },
                { timeout: 10000, maximumAge: 300000 } // 10s timeout, cache for 5 mins
            )
        }, 100) // Small delay to let app render first

        return () => clearTimeout(timeoutId)
    }, []) // Remove userData dependency - run once on mount
}

export default useGetCity