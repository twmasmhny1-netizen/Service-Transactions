import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button } from 'react-bootstrap';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';

function ManagerPanel() {
  // ========== الحالات ==========
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [noteText, setNoteText] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // ========== الفلترة ==========
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');

  // ========== جلب البيانات من Firebase ==========
  useEffect(() => {
    const q = query(
      collection(db, 'transactions'), 
      where('isDeleted', '==', false),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ========== تحميل الملاحظات من Firebase ==========
  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        notesData[data.transactionId] = data.content;
      });
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, []);

  // ========== دالة إرسال ملاحظة ==========
  const handleSendNote = async (transactionId) => {
    if (!noteText.trim()) {
      alert('من فضلك اكتب الملاحظة');
      return;
    }

    try {
      await addDoc(collection(db, 'notes'), {
        transactionId: transactionId,
        content: noteText.trim(),
        createdAt: new Date().toISOString()
      });

      setNoteText('');
      setSelectedTransactionId(null);
    } catch (error) {
      alert('حدث خطأ أثناء إرسال الملاحظة: ' + error.message);
    }
  };

  // ========== استخراج الأشهر المتاحة ==========
  const getAvailableMonths = () => {
    const monthsSet = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const monthYear = t.date.substring(0, 7);
        monthsSet.add(monthYear);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  };

  // ========== دالة فلترة المعاملات ==========
  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (selectedMonth) {
      filtered = filtered.filter(t => t.date && t.date.startsWith(selectedMonth));
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // ========== حساب الإحصائيات ==========
  const totalExports = filteredTransactions.filter(t => t.type === 'export').reduce((sum, t) => sum + t.amount, 0);
  const totalImports = filteredTransactions.filter(t => t.type === 'import').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalExports - totalImports;

  if (loading) {
    return (
      <div className="text-center py-5" style={{ direction: 'rtl' }}>
        <h5>⏳ جاري تحميل البيانات...</h5>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '20px 0'
    }}>
      <Container fluid style={{ direction: 'rtl' }}>
        <Row>
          <Col>
            {/* ===== البطاقة العلوية ===== */}
            <Card className="shadow-lg border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                padding: '25px 30px',
                color: 'white'
              }}>
                <h4 className="mb-0" style={{ fontWeight: 'bold' }}>
                  📊 لوحة تحليل المعاملات اليومية
                </h4>
                <p className="mb-0" style={{ opacity: 0.8, fontSize: '14px' }}>
                  عرض وتحليل شامل لجميع المعاملات المسجلة
                </p>
              </div>
              <Card.Body className="p-4">
                {/* ===== بطاقات الإحصائيات ===== */}
                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)', color: 'white' }}>
                      <h6 className="mb-1">📤 إجمالي الصادرات</h6>
                      <h4 className="mb-0">{totalExports.toLocaleString()} ج.م</h4>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #fdcb6e, #f39c12)', color: 'white' }}>
                      <h6 className="mb-1">📥 إجمالي الواردات</h6>
                      <h4 className="mb-0">{totalImports.toLocaleString()} ج.م</h4>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-3 rounded-3 text-center" style={{ 
                      background: totalBalance >= 0 ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : 'linear-gradient(135deg, #e17055, #d63031)',
                      color: 'white'
                    }}>
                      <h6 className="mb-1">💰 صافي الميزان</h6>
                      <h4 className="mb-0">{totalBalance.toLocaleString()} ج.م</h4>
                    </div>
                  </Col>
                </Row>

                {/* ===== أدوات الفلترة ===== */}
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: 'bold', color: '#2d3436' }}>نوع المعاملة</Form.Label>
                      <Form.Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                      >
                        <option value="all">📋 الكل</option>
                        <option value="export">📤 صادرات</option>
                        <option value="import">📥 واردات</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={{ fontWeight: 'bold', color: '#2d3436' }}>اختر الشهر</Form.Label>
                      <Form.Select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                      >
                        <option value="">📅 كل الشهور</option>
                        {getAvailableMonths().map(month => {
                          const [year, monthNum] = month.split('-');
                          const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                          return (
                            <option key={month} value={month}>
                              {monthNames[parseInt(monthNum) - 1]} {year}
                            </option>
                          );
                        })}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFilterType('all');
                        setSelectedMonth('');
                      }}
                      className="w-100"
                      style={{ borderRadius: '10px', fontWeight: 'bold' }}
                    >
                      🔄 إعادة تعيين الفلترة
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* ===== جدول المعاملات ===== */}
            <Card className="shadow-lg border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
                padding: '15px 25px',
                color: 'white'
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0" style={{ fontWeight: 'bold' }}>📋 تفاصيل المعاملات</h5>
                  <Badge bg="light" text="dark" style={{ fontSize: '14px' }}>
                    عدد المعاملات: {filteredTransactions.length}
                  </Badge>
                </div>
              </div>
              <Card.Body className="p-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-5">
                    <h6 className="text-muted">📭 لا توجد معاملات تطابق الفلترة</h6>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Table hover className="mb-0" style={{ direction: 'rtl' }}>
                      <thead style={{ background: '#f8f9fa', borderBottom: '3px solid #3498db' }}>
                        <tr>
                          <th className="text-center" style={{ padding: '12px 15px' }}>#</th>
                          <th style={{ padding: '12px 15px' }}>النوع</th>
                          <th style={{ padding: '12px 15px' }}>المبلغ</th>
                          <th style={{ padding: '12px 15px' }}>الوصف</th>
                          <th style={{ padding: '12px 15px' }}>التاريخ</th>
                          <th style={{ padding: '12px 15px', minWidth: '250px' }}>الملاحظة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t, index) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                            <td className="text-center" style={{ padding: '12px 15px' }}>{index + 1}</td>
                            <td style={{ padding: '12px 15px' }}>
                              <Badge 
                                bg={t.type === 'export' ? 'success' : 'warning'}
                                style={{ padding: '6px 15px', borderRadius: '20px', fontSize: '13px' }}
                              >
                                {t.type === 'export' ? '📤 صادرات' : '📥 واردات'}
                              </Badge>
                            </td>
                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: t.type === 'export' ? '#00b894' : '#fdcb6e' }}>
                              {t.amount.toLocaleString()} ج.م
                            </td>
                            <td style={{ padding: '12px 15px' }}>{t.description}</td>
                            <td style={{ padding: '12px 15px' }}>{t.date}</td>
                            <td style={{ padding: '12px 15px' }}>
                              {notes[t.id] && (
                                <div className="mb-2 p-2 rounded" style={{ background: '#f0f8ff', border: '1px solid #87ceeb' }}>
                                  <span className="badge bg-info" style={{ fontSize: '11px' }}>📝 ملاحظة</span>
                                  <p className="mt-1 mb-0" style={{ fontSize: '14px' }}>{notes[t.id]}</p>
                                </div>
                              )}
                              
                              {selectedTransactionId === t.id ? (
                                <div>
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="اكتب ملاحظتك هنا..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    className="mb-2"
                                    style={{ borderRadius: '8px', border: '2px solid #3498db' }}
                                  />
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleSendNote(t.id)}
                                      style={{ borderRadius: '8px', fontWeight: 'bold' }}
                                    >
                                      ✅ إرسال
                                    </Button>
                                    <Button
                                      variant="light"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTransactionId(null);
                                        setNoteText('');
                                      }}
                                      style={{ borderRadius: '8px' }}
                                    >
                                      ❌ إلغاء
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTransactionId(t.id);
                                    setNoteText('');
                                  }}
                                  style={{ borderRadius: '20px' }}
                                >
                                  ✏️ إضافة ملاحظة
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ManagerPanel;