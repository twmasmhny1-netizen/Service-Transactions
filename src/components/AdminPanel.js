import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Tabs, Tab } from 'react-bootstrap';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

function AdminPanel() {
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const [newTransaction, setNewTransaction] = useState({
    type: 'export',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const active = [];
      const deleted = [];
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (data.isDeleted) {
          deleted.push(data);
        } else {
          active.push(data);
        }
      });
      
      setTransactions(active);
      setDeletedTransactions(deleted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      alert('من فضلك اكتب المبلغ والوصف');
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        date: newTransaction.date,
        isDeleted: false,
        createdAt: new Date().toISOString()
      });

      setNewTransaction({
        type: 'export',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      alert('حدث خطأ أثناء الإضافة: ' + error.message);
    }
  };

  const handleSoftDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      try {
        await updateDoc(doc(db, 'transactions', id), {
          isDeleted: true,
          deletedAt: new Date().toISOString()
        });
      } catch (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        isDeleted: false,
        restoredAt: new Date().toISOString()
      });
    } catch (error) {
      alert('حدث خطأ أثناء الاستعادة: ' + error.message);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (error) {
        alert('حدث خطأ أثناء الحذف النهائي: ' + error.message);
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction({ ...transaction });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction.amount || !editingTransaction.description) {
      alert('من فضلك اكتب المبلغ والوصف');
      return;
    }

    try {
      await updateDoc(doc(db, 'transactions', editingTransaction.id), {
        type: editingTransaction.type,
        amount: parseFloat(editingTransaction.amount),
        description: editingTransaction.description,
        date: editingTransaction.date
      });
      
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      alert('حدث خطأ أثناء التعديل: ' + error.message);
    }
  };

  const getFilteredTransactions = (type) => {
    return transactions.filter(t => t.type === type);
  };

  if (loading) {
    return (
      <div className="text-center py-5" style={{ direction: 'rtl' }}>
        <h5>⏳ جاري تحميل البيانات...</h5>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #e8f0fe 0%, #d4e4f7 100%)',
      minHeight: '100vh',
      padding: '20px 0'
    }}>
      <Container fluid style={{ direction: 'rtl' }}>
        <Row>
          <Col md={4}>
            <Card className="shadow-lg border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '20px 25px',
                color: 'white'
              }}>
                <h5 className="mb-0" style={{ fontWeight: 'bold' }}>✏️ إضافة معاملة جديدة</h5>
              </div>
              <Card.Body className="p-4">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 'bold' }}>نوع المعاملة</Form.Label>
                    <Form.Select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                      style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                    >
                      <option value="export">📤 صادرات</option>
                      <option value="import">📥 واردات</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 'bold' }}>المبلغ (بالجنيه)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="مثال: 5000"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 'bold' }}>الوصف</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="مثال: دفع فاتورة"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: 'bold' }}>التاريخ</Form.Label>
                    <Form.Control
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      style={{ borderRadius: '10px', border: '2px solid #dfe6e9' }}
                    />
                  </Form.Group>

                  <Button 
                    variant="success" 
                    onClick={handleAdd} 
                    className="w-100"
                    style={{ borderRadius: '10px', fontWeight: 'bold', padding: '12px' }}
                  >
                    ➕ إضافة المعاملة
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="shadow-lg border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
                padding: '15px 25px',
                color: 'white'
              }}>
                <h6 className="mb-0" style={{ fontWeight: 'bold' }}>📊 الإحصائيات السريعة</h6>
              </div>
              <Card.Body className="p-4">
                <Row className="g-2">
                  <Col xs={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)', color: 'white' }}>
                      <small>📤 الصادرات</small>
                      <h5 className="mb-0">{transactions.filter(t => t.type === 'export').length}</h5>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #fdcb6e, #f39c12)', color: 'white' }}>
                      <small>📥 الواردات</small>
                      <h5 className="mb-0">{transactions.filter(t => t.type === 'import').length}</h5>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: 'white' }}>
                      <small>💰 إجمالي</small>
                      <h5 className="mb-0">{transactions.length}</h5>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #e17055, #d63031)', color: 'white' }}>
                      <small>🗑️ محذوف</small>
                      <h5 className="mb-0">{deletedTransactions.length}</h5>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '15px 25px',
                color: 'white'
              }}>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-0"
                  style={{ borderBottom: 'none' }}
                >
                  <Tab 
                    eventKey="active" 
                    title={`📋 النشطة (${transactions.length})`}
                    tabClassName="bg-transparent text-white border-0"
                  />
                  <Tab 
                    eventKey="deleted" 
                    title={`🗑️ المحذوفات (${deletedTransactions.length})`}
                    tabClassName="bg-transparent text-white border-0"
                  />
                </Tabs>
              </div>
              <Card.Body className="p-0">
                {activeTab === 'active' ? (
                  <div style={{ maxHeight: '650px', overflowY: 'auto', padding: '20px' }}>
                    {transactions.length === 0 ? (
                      <div className="text-center py-5">
                        <h6 className="text-muted">📭 لا توجد معاملات مسجلة</h6>
                      </div>
                    ) : (
                      <>
                        {getFilteredTransactions('export').length > 0 && (
                          <>
                            <h6 className="mb-3" style={{ color: '#00b894', fontWeight: 'bold' }}>📤 الصادرات</h6>
                            <Table hover responsive className="mb-4" style={{ fontSize: '14px' }}>
                              <thead style={{ background: '#f8f9fa' }}>
                                <tr>
                                  <th>#</th>
                                  <th>المبلغ</th>
                                  <th>الوصف</th>
                                  <th>التاريخ</th>
                                  <th>إجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getFilteredTransactions('export').map((t, index) => (
                                  <tr key={t.id}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: 'bold', color: '#00b894' }}>{t.amount.toLocaleString()}</td>
                                    <td>{t.description}</td>
                                    <td>{t.date}</td>
                                    <td>
                                      <Button variant="outline-warning" size="sm" className="me-1" onClick={() => handleEdit(t)}>
                                        ✏️
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleSoftDelete(t.id)}>
                                        🗑️
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </>
                        )}

                        {getFilteredTransactions('import').length > 0 && (
                          <>
                            <h6 className="mb-3" style={{ color: '#fdcb6e', fontWeight: 'bold' }}>📥 الواردات</h6>
                            <Table hover responsive className="mb-0" style={{ fontSize: '14px' }}>
                              <thead style={{ background: '#f8f9fa' }}>
                                <tr>
                                  <th>#</th>
                                  <th>المبلغ</th>
                                  <th>الوصف</th>
                                  <th>التاريخ</th>
                                  <th>إجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getFilteredTransactions('import').map((t, index) => (
                                  <tr key={t.id}>
                                    <td>{index + 1}</td>
                                    <td style={{ fontWeight: 'bold', color: '#fdcb6e' }}>{t.amount.toLocaleString()}</td>
                                    <td>{t.description}</td>
                                    <td>{t.date}</td>
                                    <td>
                                      <Button variant="outline-warning" size="sm" className="me-1" onClick={() => handleEdit(t)}>
                                        ✏️
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleSoftDelete(t.id)}>
                                        🗑️
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ maxHeight: '650px', overflowY: 'auto', padding: '20px' }}>
                    {deletedTransactions.length === 0 ? (
                      <div className="text-center py-5">
                        <h6 className="text-muted">🗑️ سلة المحذوفات فارغة</h6>
                      </div>
                    ) : (
                      <Table hover responsive className="mb-0" style={{ fontSize: '14px' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                          <tr>
                            <th>#</th>
                            <th>النوع</th>
                            <th>المبلغ</th>
                            <th>الوصف</th>
                            <th>التاريخ</th>
                            <th>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deletedTransactions.map((t, index) => (
                            <tr key={t.id}>
                              <td>{index + 1}</td>
                              <td>
                                <Badge bg={t.type === 'export' ? 'success' : 'warning'}>
                                  {t.type === 'export' ? '📤 صادرات' : '📥 واردات'}
                                </Badge>
                              </td>
                              <td>{t.amount.toLocaleString()}</td>
                              <td>{t.description}</td>
                              <td>{t.date}</td>
                              <td>
                                <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleRestore(t.id)}>
                                  ↩️
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handlePermanentDelete(t.id)}>
                                  ❌
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#1a1a2e', color: 'white' }}>
          <Modal.Title>✏️ تعديل المعاملة</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {editingTransaction && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 'bold' }}>نوع المعاملة</Form.Label>
                <Form.Select
                  value={editingTransaction.type}
                  onChange={(e) => setEditingTransaction({...editingTransaction, type: e.target.value})}
                >
                  <option value="export">📤 صادرات</option>
                  <option value="import">📥 واردات</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 'bold' }}>المبلغ</Form.Label>
                <Form.Control
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 'bold' }}>الوصف</Form.Label>
                <Form.Control
                  type="text"
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-0">
                <Form.Label style={{ fontWeight: 'bold' }}>التاريخ</Form.Label>
                <Form.Control
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} style={{ fontWeight: 'bold' }}>
            💾 حفظ التعديلات
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminPanel;
