<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\Finance\DeliveryOrderController;
use App\Http\Controllers\API\Finance\InvoiceController;

Route::get('/finance/delivery-orders', [DeliveryOrderController::class, 'index']);
Route::post('/finance/delivery-orders', [DeliveryOrderController::class, 'store']);
Route::get('finance/delivery-orders/{id}', [DeliveryOrderController::class, 'show']);
Route::put('/finance/delivery-orders/{id}', [DeliveryOrderController::class, 'update']);
Route::delete('finance/delivery-orders/{id}', [DeliveryOrderController::class, 'destroy']);

Route::get('/finance/invoices', [InvoiceController::class, 'index']);
Route::post('/finance/invoices', [InvoiceController::class, 'store']);
Route::get('/finance/invoices/{id}', [InvoiceController::class, 'show']);
Route::put('/finance/invoices/{id}', [InvoiceController::class, 'update']);
Route::delete('/finance/invoices/{id}', [InvoiceController::class, 'destroy']);
Route::get('/finance/invoices/next-id', [InvoiceController::class, 'nextId']);
Route::get('/finance/invoices/validate-sequence', [InvoiceController::class, 'validateSequence']);
Route::get('/finance/invoices/validate', [InvoiceController::class, 'validateInvoice']);
Route::get('/finance/invoices/preview-taxes', [InvoiceController::class, 'previewTaxes']);
