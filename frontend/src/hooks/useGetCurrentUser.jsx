
import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData, setAuthLoading, fetchCart } from '../redux/userSlice'

function useGetCurrentUser() {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Run user fetch and cart fetch in parallel for faster loading
        const [userResult] = await Promise.all([
          axios.get(`${serverUrl}/api/user/current`, { withCredentials: true }),
          dispatch(fetchCart()) // Start cart fetch immediately, don't wait for user
        ])
        dispatch(setUserData(userResult.data))
      } catch (error) {
        console.log(error)
      } finally {
        dispatch(setAuthLoading(false))
      }
    }
    fetchUser()
  }, [])
}

export default useGetCurrentUser