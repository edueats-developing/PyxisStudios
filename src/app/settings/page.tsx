'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  BuildingStorefrontIcon, 
  UserIcon, 
  ShoppingBagIcon, 
  PhoneIcon, 
  MapPinIcon, 
  TagIcon, 
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

import SettingsTabs from '@/components/SettingsTabs'
import SettingsCard from '@/components/SettingsCard'
import FormField, { Input, Select, Textarea, Checkbox } from '@/components/FormField'
import ProfileCompletionIndicator from '@/components/ProfileCompletionIndicator'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'

interface Restaurant {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  type: 'restaurant' | 'convenience' | null;
  categories: string[];
}

const RESTAURANT_CATEGORIES = [
  'Japanese', 'Pizza', 'Indian', 'Italian', 'Korean', 
  'Chinese', 'Thai', 'Greek', 'Halal', 'Coffee'
];

const CONVENIENCE_CATEGORIES = [
  'Grocery', 'Convenience', 'Coffee'
];

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [actionCount, setActionCount] = useState(0)
  const [activeTab, setActiveTab] = useState('restaurant')
  const [formState, setFormState] = useState<{
    address: string;
    phone: string;
    type: '' | 'restaurant' | 'convenience';
    description: string;
    categories: string[];
  }>({
    address: '',
    phone: '',
    type: '',
    description: '',
    categories: []
  })
  const [formChanged, setFormChanged] = useState(false)
  
  const { 
    notifications, 
    addSuccessNotification, 
    addErrorNotification, 
    dismissNotification 
  } = useNotifications()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch restaurant data if user is admin
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single()

      if (!error && restaurantData) {
        setRestaurant(restaurantData)
        setFormState({
          address: restaurantData.address || '',
          phone: restaurantData.phone || '',
          type: restaurantData.type || '',
          description: restaurantData.description || '',
          categories: restaurantData.categories || []
        })
        
        // Calculate action count
        let count = 0
        if (!restaurantData.address) count++
        if (!restaurantData.phone) count++
        if (!restaurantData.type) count++
        if (!restaurantData.categories?.length) count++
        setActionCount(count)
      }
    }
    checkUser()
  }, [router])

  // Update form state when restaurant data changes
  useEffect(() => {
    if (restaurant) {
      setFormState({
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        type: restaurant.type || '',
        description: restaurant.description || '',
        categories: restaurant.categories || []
      })
    }
  }, [restaurant])

  // Check if form has changed
  useEffect(() => {
    if (restaurant) {
      const hasChanged = 
        formState.address !== (restaurant.address || '') ||
        formState.phone !== (restaurant.phone || '') ||
        formState.type !== (restaurant.type || '') ||
        formState.description !== (restaurant.description || '') ||
        JSON.stringify(formState.categories) !== JSON.stringify(restaurant.categories || [])
      
      setFormChanged(hasChanged)
    }
  }, [formState, restaurant])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleFormChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...formState.categories, category]
      : formState.categories.filter(c => c !== category)
    
    handleFormChange('categories', newCategories)
  }

  const handleTypeChange = (type: string) => {
    // Reset categories when type changes
    handleFormChange('type', type as 'restaurant' | 'convenience' | '')
    handleFormChange('categories', [])
  }

  const handleSaveRestaurantInfo = async () => {
    if (!restaurant) return
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          address: formState.address || null,
          phone: formState.phone || null,
          type: formState.type || null,
          description: formState.description || null,
          categories: formState.categories
        })
        .eq('id', restaurant.id)
      
      if (error) throw error
      
      // Update restaurant state
      setRestaurant({
        ...restaurant,
        address: formState.address || null,
        phone: formState.phone || null,
        type: formState.type || null,
        description: formState.description || null,
        categories: formState.categories
      })
      
      // Recalculate action count
      let count = 0
      if (!formState.address) count++
      if (!formState.phone) count++
      if (!formState.type) count++
      if (!formState.categories.length) count++
      setActionCount(count)
      
      addSuccessNotification('Restaurant information updated successfully')
    } catch (err: any) {
      addErrorNotification(`Failed to update restaurant information: ${err.message}`)
    }
  }

  // Profile completion steps
  const profileSteps = [
    {
      id: 'address',
      label: 'Add restaurant address',
      completed: !!formState.address,
      required: true
    },
    {
      id: 'phone',
      label: 'Add phone number',
      completed: !!formState.phone,
      required: true
    },
    {
      id: 'type',
      label: 'Select store type',
      completed: !!formState.type,
      required: true
    },
    {
      id: 'categories',
      label: 'Select categories',
      completed: formState.categories.length > 0,
      required: true
    },
    {
      id: 'description',
      label: 'Add description',
      completed: !!formState.description,
      required: false
    }
  ]

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      
      <SettingsTabs
        tabs={[
          { id: 'restaurant', label: 'Restaurant', icon: <BuildingStorefrontIcon className="h-5 w-5" /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBagIcon className="h-5 w-5" /> },
          { id: 'account', label: 'Account', icon: <UserIcon className="h-5 w-5" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        actionCount={actionCount}
      />
      
      <div className="space-y-6">
        {/* Restaurant Tab */}
        {activeTab === 'restaurant' && restaurant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SettingsCard 
                title="Restaurant Information" 
                saveLabel="Save Changes"
                onSave={handleSaveRestaurantInfo}
                saveDisabled={!formChanged}
              >
                <div className="space-y-4">
                  <FormField 
                    label="Address" 
                    htmlFor="address" 
                    required={true}
                    icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
                  >
                    <Input
                      id="address"
                      value={formState.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Enter restaurant address"
                    />
                  </FormField>
                  
                  <FormField 
                    label="Phone Number" 
                    htmlFor="phone" 
                    required={true}
                    icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                  >
                    <Input
                      type="tel"
                      id="phone"
                      value={formState.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </FormField>
                  
                  <FormField 
                    label="Store Type" 
                    htmlFor="type" 
                    required={true}
                    icon={<BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />}
                  >
                    <Select
                      id="type"
                      value={formState.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="convenience">Convenience Store</option>
                    </Select>
                  </FormField>
                  
                  <FormField 
                    label="Description" 
                    htmlFor="description"
                    icon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}
                    hint="Provide a brief description of your restaurant"
                  >
                    <Textarea
                      id="description"
                      value={formState.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Enter restaurant description"
                      rows={4}
                    />
                  </FormField>
                </div>
              </SettingsCard>
              
              {formState.type && (
                <SettingsCard 
                  title="Categories" 
                  saveLabel="Save Categories"
                  onSave={handleSaveRestaurantInfo}
                  saveDisabled={!formChanged}
                >
                  <FormField 
                    label="Select Categories" 
                    htmlFor="categories" 
                    required={true}
                    icon={<TagIcon className="h-5 w-5 text-gray-400" />}
                    hint="Select all categories that apply to your business"
                  >
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {(formState.type === 'restaurant' ? RESTAURANT_CATEGORIES : CONVENIENCE_CATEGORIES).map((category) => (
                        <Checkbox
                          key={category}
                          id={`category-${category}`}
                          name={`category-${category}`}
                          checked={formState.categories.includes(category)}
                          onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                          label={category}
                        />
                      ))}
                    </div>
                  </FormField>
                </SettingsCard>
              )}
            </div>
            
            <div className="space-y-6">
              <ProfileCompletionIndicator steps={profileSteps} />
              
              <SettingsCard title="Quick Links">
                <nav className="space-y-2">
                  <Link href="/admin/menu-management" className="flex items-center p-2 text-[#00A7A2] hover:bg-[#00A7A2] hover:bg-opacity-10 rounded-md transition-colors">
                    <TagIcon className="h-5 w-5 mr-3" />
                    <span>Manage Menu</span>
                  </Link>
                  <Link href="/admin/orders" className="flex items-center p-2 text-[#00A7A2] hover:bg-[#00A7A2] hover:bg-opacity-10 rounded-md transition-colors">
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    <span>View Orders</span>
                  </Link>
                  <Link href="/admin/design" className="flex items-center p-2 text-[#00A7A2] hover:bg-[#00A7A2] hover:bg-opacity-10 rounded-md transition-colors">
                    <Cog6ToothIcon className="h-5 w-5 mr-3" />
                    <span>Customize Store</span>
                  </Link>
                </nav>
              </SettingsCard>
            </div>
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SettingsCard title="Orders Management">
                <div className="space-y-4">
                  <Link href="/order-history" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <ClockIcon className="h-6 w-6 text-[#00A7A2] mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Order History</h3>
                      <p className="text-sm text-gray-500">View all past orders and their details</p>
                    </div>
                  </Link>
                  
                  <Link href="/order-tracking" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <TruckIcon className="h-6 w-6 text-[#00A7A2] mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Track Orders</h3>
                      <p className="text-sm text-gray-500">Track the status of current orders</p>
                    </div>
                  </Link>
                </div>
              </SettingsCard>
            </div>
          </div>
        )}
        
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SettingsCard title="Account Management">
                <div className="space-y-4">
                  <Link href="/account" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <Cog6ToothIcon className="h-6 w-6 text-[#00A7A2] mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Account Settings</h3>
                      <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
                    </div>
                  </Link>
                  
                  <Link href="/profile" className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <UserCircleIcon className="h-6 w-6 text-[#00A7A2] mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Profile Settings</h3>
                      <p className="text-sm text-gray-500">Update your personal information and profile</p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-red-600">Logout</h3>
                      <p className="text-sm text-red-500">Sign out of your account</p>
                    </div>
                  </button>
                </div>
              </SettingsCard>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
    </div>
  )
}
