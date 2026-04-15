import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '@/modules/landing/context/AuthContext'
import {
  CheckCircle2,
  Copy,
  Landmark,
  User,
  Calendar,
  Wallet2,
  Info,
  Receipt,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'react-toastify'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ReferralList() {
  const { token } = useContext(AuthContext)
  const [claims, setClaims] = useState([])
  const [payoutHistory, setPayoutHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [viewAccountOpen, setViewAccountOpen] = useState(false)

  const [confirmPayOpen, setConfirmPayOpen] = useState(false)
  const [selectedClaimId, setSelectedClaimId] = useState(null)
  const [transactionRef, setTransactionRef] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchClaims(), fetchHistory()])
    setLoading(false)
  }

  const fetchClaims = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/admin/all-claims`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.success) setClaims(result.claims || [])
      else toast.error(result.message || 'Failed to load pending claims')
    } catch {
      toast.error('Network error – pending claims')
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/admin/payout-history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.success) setPayoutHistory(result.history || [])
    } catch {
      console.error('Failed to load payout history')
    }
  }

  const fetchPaymentAccount = async (userId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/referral-commissions/admin/payment-account/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const result = await res.json()
      if (result.success && result.account) {
        setSelectedAccount(result.account)
        setViewAccountOpen(true)
      } else {
        toast.warning('No payout method configured yet.')
      }
    } catch {
      toast.error('Could not load account details')
    }
  }

  const handleConfirmPay = async () => {
    const ref = transactionRef.trim()
    if (!ref) {
      toast.error('Please enter a transaction reference')
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/admin/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commissionIds: [selectedClaimId], remarks: ref }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Payment marked as settled')
        setConfirmPayOpen(false)
        setTransactionRef('')
        fetchData()
      } else {
        toast.error(result.message || 'Failed to mark as paid')
      }
    } catch {
      toast.error('Server connection failed')
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/admin/mark-read/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Marked as read')
        fetchData()
      } else {
        toast.error(result.message || 'Failed to mark as read')
      }
    } catch {
      toast.error('Network error - mark as read')
    }
  }

  const copyToClipboard = async (text, label = 'Value') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`, { autoClose: 1400 })
    } catch {
      toast.error('Copy failed')
    }
  }

  if (loading) {
    return <AdminSkeleton />
  }

  return (
    <div className="container max-w-7xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            Payout Management
          </h1>
          <p className="text-muted-foreground">
            Manage pending referral payouts and view settlement history
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/40 px-5 py-3 rounded-xl border">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg">
            <Wallet2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending
            </p>
            <p className="text-2xl font-bold">{claims.length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full max-w-sm grid-cols-2 bg-transparent border-b">
          <TabsTrigger
            value="pending"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            Pending ({claims.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          >
            History ({payoutHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          {claims.length === 0 ? (
            <EmptyState message="No pending payout requests at the moment." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {claims.map((claim) => (
                <Card
                  key={claim._id}
                  className="overflow-hidden transition-all hover:shadow-md hover:border-primary/30"
                >
                  <CardContent className="p-0">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {claim.referrer_id.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                            <span>{claim.referrer_id.name}</span>
                            {claim.markAsRead === false && (
                              <Badge className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0 h-4 uppercase border-0">New</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {claim.referrer_id.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Requested</p>
                          <p className="font-medium">
                            {new Date(claim.claim_request_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Referred</p>
                          <p className="font-medium truncate">{claim.referred_user_id.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 px-6 py-5 border-t flex flex-col gap-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Payable Amount</p>
                          <p className="text-3xl font-bold tracking-tight">
                            ₹{claim.commission_amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {claim.commission_percentage}% commission
                        </Badge>
                      </div>

                      <div className="flex gap-3">
                        {claim.markAsRead === false && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-10 flex-shrink-0 text-gray-500"
                            onClick={() => handleMarkAsRead(claim._id)}
                            title="Mark as Read"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => fetchPaymentAccount(claim.referrer_id._id)}
                        >
                          <Landmark className="mr-2 h-4 w-4" />
                          View Account
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary/90"
                          onClick={() => {
                            setSelectedClaimId(claim._id)
                            setConfirmPayOpen(true)
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Settle Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">
                        Partner
                      </th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">
                        Referral
                      </th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left px-6 py-4 font-medium text-muted-foreground">
                        Ref / UTR
                      </th>
                      <th className="text-right px-6 py-4 font-medium text-muted-foreground">
                        Settled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payoutHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium">{item.referrer_id?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.referrer_id?.email || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {item.referred_user_id?.name || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">
                            ₹{item.commission_amount.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                            <span className="font-mono text-sm text-muted-foreground">
                              {item.admin_remarks || '—'}
                            </span>
                            {item.admin_remarks && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => copyToClipboard(item.admin_remarks, 'UTR')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {new Date(item.paid_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                    {payoutHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-muted-foreground">
                          No payout history available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Details Dialog */}
      <Dialog open={viewAccountOpen} onOpenChange={setViewAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Payout Account
            </DialogTitle>
          </DialogHeader>

          {selectedAccount ? (
            <div className="space-y-6 py-4">
              <Badge variant="outline" className="w-fit">
                {selectedAccount.payment_method.replace('_', ' ')}
              </Badge>

              {selectedAccount.payment_method === 'BANK' && selectedAccount.bank_details ? (
                <div className="space-y-5">
                  <DetailItem
                    label="Account Holder"
                    value={selectedAccount.bank_details.account_holder_name}
                    onCopy={copyToClipboard}
                  />
                  <DetailItem
                    label="Account Number"
                    value={selectedAccount.bank_details.account_number}
                    onCopy={copyToClipboard}
                    mono
                  />
                  <DetailItem
                    label="IFSC Code"
                    value={selectedAccount.bank_details.ifsc_code}
                    onCopy={copyToClipboard}
                    mono
                  />
                  <DetailItem
                    label="Bank Name"
                    value={selectedAccount.bank_details.bank_name || 'Not specified'}
                  />
                </div>
              ) : (
                <div className="bg-muted p-5 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {selectedAccount.payment_method === 'UPI_ID' ? 'UPI ID' : 'UPI Mobile'}
                  </p>
                  <div className="flex items-center justify-between font-mono text-lg font-semibold">
                    <span>{selectedAccount.upi_id || selectedAccount.upi_number || '—'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(
                          selectedAccount.upi_id || selectedAccount.upi_number,
                          'UPI'
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No account details available
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAccountOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Confirmation */}
      <AlertDialog open={confirmPayOpen} onOpenChange={setConfirmPayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Settlement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Enter the transaction reference / UTR number to mark this payout as completed.
              </p>
              <div className="space-y-2">
                <Label htmlFor="ref">Transaction Reference</Label>
                <Input
                  id="ref"
                  placeholder="UTR123456789..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPay}
              disabled={!transactionRef.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Confirm & Settle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ────────────────────────────────────────────────
   Reusable small components
 ───────────────────────────────────────────────── */

function DetailItem({ label, value, onCopy, mono = false }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="group flex items-center justify-between text-sm font-medium">
        <span className={`${mono ? 'font-mono tracking-tight' : ''} break-all`}>{value}</span>
        {onCopy && value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={() => onCopy(value, label)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <Card className="border-dashed py-20">
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="bg-muted p-5 rounded-full">
          <Info className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function AdminSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto py-10 space-y-10">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-48" />
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
