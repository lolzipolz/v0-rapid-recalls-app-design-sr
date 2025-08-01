"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowRight, CheckCircle, Bell, Package, Zap, Users, Star } from "lucide-react"

interface User {
  id: string
  email: string
  notification_preferences: any
  created_at: string
  last_login: string
}

export default function WelcomeScreen({ user }: { user: User }) {
  const router = useRouter()

  const isNewUser = new Date(user.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isNewUser ? "Welcome to RapidRecalls!" : "Welcome back!"}
          </h1>

          <p className="text-xl text-gray-600 mb-2">
            Hi {user.email.split("@")[0]}, you're all set to start monitoring your products.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Account Active
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Bell className="h-4 w-4 mr-2" />
              Notifications Enabled
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Shield className="h-4 w-4 mr-2" />
              Protected
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
              <div className="text-sm text-gray-600">Products Added</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Monitoring Active</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Premium</div>
              <div className="text-sm text-gray-600">Protection Level</div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Protected?</CardTitle>
            <CardDescription className="text-lg">
              Let's add your first product and start monitoring for recalls
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Add Your Products</h3>
                    <p className="text-gray-600 text-sm">
                      Start by adding products you own - electronics, appliances, toys, food, or vehicles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Automatic Monitoring</h3>
                    <p className="text-gray-600 text-sm">
                      We'll continuously monitor FDA, CPSC, NHTSA, and USDA databases for recalls.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Instant Alerts</h3>
                    <p className="text-gray-600 text-sm">
                      Get notified immediately via email when recalls affect your products.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Take Action</h3>
                    <p className="text-gray-600 text-sm">
                      Follow recall instructions to keep your family safe from dangerous products.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button size="lg" className="text-lg px-8 py-3" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Join over 50,000 families already protected by RapidRecalls</p>
                <div className="flex justify-center items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.9/5 from 2,847 reviews</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by families nationwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">50K+ Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">{"<"}5min Alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
