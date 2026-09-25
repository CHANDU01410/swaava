
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { addToCartAPI } from '../redux/userSlice'

const UserDashboard = () => {
  const { userData, currentCity, shopInMyCity, itemsInMyCity, searchItems } = useSelector(state => state.user)
  const dispatch = useDispatch()
  const [addingItemId, setAddingItemId] = useState(null)
  const [addedItemId, setAddedItemId] = useState(null)

  const handleAddToCart = async (item) => {
    setAddingItemId(item._id)
    try {
      await dispatch(addToCartAPI({
        itemId: item._id,
        name: item.name,
        image: item.image || "",
        price: item.price,
        quantity: 1,
        chef: item.shop?.shopName || item.shop?.name || ""
      })).unwrap()
      setAddedItemId(item._id)
      setTimeout(() => setAddedItemId(null), 1500)
    } catch (err) {
      console.error("Add to cart failed:", err)
    } finally {
      setAddingItemId(null)
    }
  }

  return (
    <div className='w-full max-w-[1200px] px-[20px] py-[20px]'>
      {/* Welcome Section */}
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-800'>
          Welcome, {userData?.fullName || 'User'} 👋
        </h2>
        <p className='text-gray-500 mt-1'>
          {currentCity ? `Showing food options in ${currentCity}` : 'Discovering delicious home-cooked food near you...'}
        </p>
      </div>

      {/* Search Results */}
      {searchItems && (
        <div className='mb-8'>
          <h3 className='text-xl font-semibold text-gray-700 mb-4'>Search Results</h3>
          {searchItems.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {searchItems.map((item) => (
                <div key={item._id} className='bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow'>
                  <h4 className='font-semibold text-gray-800'>{item.name}</h4>
                  <p className='text-gray-500 text-sm mt-1'>{item.description}</p>
                  <div className='flex items-center justify-between mt-3'>
                    <p className='text-[#f4a462] font-bold'>₹{item.price}</p>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1 ${addedItemId === item._id
                        ? 'bg-green-500 text-white'
                        : 'bg-[#f4a462] text-white hover:bg-[#e8944f]'
                        }`}
                      onClick={() => handleAddToCart(item)}
                      disabled={addingItemId === item._id}
                    >
                      {addingItemId === item._id ? (
                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      ) : addedItemId === item._id ? (
                        <><span className="material-symbols-outlined text-sm">check</span> Added</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-400'>No items found matching your search.</p>
          )}
        </div>
      )}

      {/* Items in City */}
      {!searchItems && itemsInMyCity && itemsInMyCity.length > 0 && (
        <div className='mb-8'>
          <h3 className='text-xl font-semibold text-gray-700 mb-4'>🍲 Available Food Items</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {itemsInMyCity.map((item) => (
              <div key={item._id} className='bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer'>
                {item.image && <img src={item.image} alt={item.name} className='w-full h-[150px] object-cover rounded-lg mb-3' />}
                <h4 className='font-semibold text-gray-800'>{item.name}</h4>
                <p className='text-gray-500 text-sm mt-1 line-clamp-2'>{item.description}</p>
                <div className='flex items-center justify-between mt-3'>
                  <p className='text-[#f4a462] font-bold'>₹{item.price}</p>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1 ${addedItemId === item._id
                      ? 'bg-green-500 text-white'
                      : 'bg-[#f4a462] text-white hover:bg-[#e8944f]'
                      }`}
                    onClick={() => handleAddToCart(item)}
                    disabled={addingItemId === item._id}
                  >
                    {addingItemId === item._id ? (
                      <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    ) : addedItemId === item._id ? (
                      <><span className="material-symbols-outlined text-sm">check</span> Added</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shops in City */}
      {!searchItems && shopInMyCity && shopInMyCity.length > 0 && (
        <div className='mb-8'>
          <h3 className='text-xl font-semibold text-gray-700 mb-4'>👨‍🍳 Home Cooks Near You</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {shopInMyCity.map((shop) => (
              <div key={shop._id} className='bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer'>
                <h4 className='font-semibold text-gray-800'>{shop.shopName || shop.name}</h4>
                <p className='text-gray-500 text-sm mt-1'>{shop.address || shop.city}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searchItems && (!itemsInMyCity || itemsInMyCity.length === 0) && (!shopInMyCity || shopInMyCity.length === 0) && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='text-6xl mb-4'>🍽️</div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>No food items available yet</h3>
          <p className='text-gray-400 text-center max-w-md'>
            {currentCity
              ? `We're still bringing home cooks to ${currentCity}. Check back soon!`
              : 'Allow location access to discover delicious home-cooked food near you.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default UserDashboard