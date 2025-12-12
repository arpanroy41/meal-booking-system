import { useState, useEffect } from 'react';
import {
  PageSection,
  Card,
  CardBody,
  Title,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Spinner,
  Alert,
} from '@patternfly/react-core';
import { supabase, TABLES, ROLES } from '../../services/supabase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleUpdateRole = async () => {
    try {
      const { error } = await supabase
        .from(TABLES.EMPLOYEES)
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'User role updated successfully',
      });
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to update user role',
      });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'blue';
      case ROLES.VENDOR:
        return 'purple';
      default:
        return 'grey';
    }
  };

  if (loading) {
    return (
      <PageSection>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="xl" />
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Card>
        <CardBody>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: '24px' }}>
            User Management
          </Title>

          {notification && (
            <Alert
              variant={notification.type}
              title={notification.message}
              style={{ marginBottom: '16px' }}
              actionClose={
                <Button variant="plain" onClick={() => setNotification(null)}>
                  ×
                </Button>
              }
            />
          )}

          <DataList aria-label="Users list">
            {users.map((user) => (
              <DataListItem key={user.id}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="name" width={2}>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: '0.9rem', color: '#6a6e73' }}>
                          {user.employee_id}
                        </div>
                      </DataListCell>,
                      <DataListCell key="email" width={3}>
                        {user.email}
                      </DataListCell>,
                      <DataListCell key="role" width={2}>
                        <Badge color={getRoleBadgeColor(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </DataListCell>,
                      <DataListCell key="actions" width={2}>
                        <Button
                          variant="link"
                          onClick={() => handleEditRole(user)}
                        >
                          Edit Role
                        </Button>
                      </DataListCell>,
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            ))}
          </DataList>
        </CardBody>
      </Card>

      {/* Edit Role Modal */}
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="edit-role-modal-title"
        aria-describedby="edit-role-modal-body"
      >
        <ModalHeader title="Edit User Role" labelId="edit-role-modal-title" />
        <ModalBody id="edit-role-modal-body">
          {selectedUser && (
            <Form>
              <p><strong>User:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              
              <FormGroup label="Role" isRequired fieldId="role">
                <FormSelect
                  value={newRole}
                  onChange={(e, value) => setNewRole(value)}
                  id="role"
                >
                  <FormSelectOption value={ROLES.EMPLOYEE} label="Employee" />
                  <FormSelectOption value={ROLES.ADMIN} label="Admin" />
                  <FormSelectOption value={ROLES.VENDOR} label="Vendor" />
                </FormSelect>
              </FormGroup>
            </Form>
          )}
        </ModalBody>
        <ModalFooter>
          <Button key="save" variant="primary" onClick={handleUpdateRole}>
            Save
          </Button>
          <Button key="cancel" variant="link" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default UserManagement;

