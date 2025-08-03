// components/crypto/TransactionHistory.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

type TransactionStatus = 'confirmed' | 'pending' | 'failed';
type TransactionType = 'sent' | 'received' | 'exchange';

interface Transaction {
  id: string;
  txHash: string;
  amount: number;
  currency: 'BTC' | 'USD';
  date: Date;
  status: TransactionStatus;
  type: TransactionType;
  address: string;
  confirmations: number;
  fee?: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onRefresh?: () => Promise<void>;
  className?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onRefresh,
  className,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'sent':
        return <Icons.ArrowUp className="h-4 w-4 text-red-500" />;
      case 'received':
        return <Icons.ArrowDown className="h-4 w-4 text-green-500" />;
      case 'exchange':
        return <Icons.Repeat className="h-4 w-4 text-blue-500" />;
      default:
        return <Icons.Wallet className="h-4 w-4" />;
    }
  };

  const openInExplorer = (txHash: string) => {
    window.open(`https://www.blockchain.com/explorer/transactions/btc/${txHash}`, '_blank');
  };

  return (
    <div className={cn('border rounded-lg bg-white shadow-sm', className)}>
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold">Bitcoin Transaction History</h3>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by TX hash or address"
            className="w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus | 'all')}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'all')}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="exchange">Exchange</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <Icons.RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {tx.type === 'sent' ? '-' : '+'}
                      {tx.amount.toFixed(8)} {tx.currency}
                    </div>
                    {tx.currency === 'BTC' && tx.type !== 'exchange' && (
                      <div className="text-xs text-gray-500">
                        ≈ ${(tx.amount * 50000).toFixed(2)} USD
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[150px] truncate">
                    {tx.address}
                  </TableCell>
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tx.status)}
                      {tx.fee && tx.type === 'sent' && (
                        <span className="text-xs text-gray-500">
                          Fee: {tx.fee.toFixed(8)} BTC
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.status === 'confirmed' ? (
                      <span>{tx.confirmations}</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Icons.MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openInExplorer(tx.txHash)}>
                          <Icons.ExternalLink className="mr-2 h-4 w-4" />
                          View in Explorer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tx.txHash)}>
                          <Icons.Copy className="mr-2 h-4 w-4" />
                          Copy TX Hash
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tx.address)}>
                          <Icons.Copy className="mr-2 h-4 w-4" />
                          Copy Address
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            Previous
          </Button>
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;