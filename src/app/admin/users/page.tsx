"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SpinnerWithText } from "@/components/ui/spinner";
import { UserModal } from "@/components/UserModal";
import { PasswordModal } from "@/components/PasswordModal";
import { medicalToasts } from "@/lib/toast";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
} from "lucide-react";

import { User } from "@/types/users";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Verificar permisos
  useEffect(() => {
    if (user && user.role?.name !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error("Error fetching users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.name === "admin") {
      fetchUsers();
    }
  }, [user]);

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        medicalToasts.userDeleted(userToDelete.name);
        await fetchUsers();
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const error = await response.json();
        console.error("Error deleting user:", error);
        medicalToasts.userError('eliminar');
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      medicalToasts.networkError();
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (response.ok) {
        const action = user.isActive ? 'desactivado' : 'activado';
        medicalToasts.userUpdated(`${user.name} (${action})`);
        await fetchUsers();
      } else {
        const error = await response.json();
        console.error("Error toggling user status:", error);
        medicalToasts.userError('cambiar estado');
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      medicalToasts.networkError();
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const roleNames: { [key: string]: string } = {
      admin: "Administrador",
      especialista: "Especialista",
      recepcion: "Recepción",
      caja: "Caja",
    };
    return roleNames[roleName] || roleName;
  };

  const getRoleBadgeVariant = (roleName: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      admin: "destructive",
      especialista: "default",
      recepcion: "secondary",
      caja: "outline",
    };
    return variants[roleName] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithText size="lg" text="Cargando usuarios..." />
      </div>
    );
  }

  if (user?.role?.name !== "admin") {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Gestión de Usuarios
            </h2>
            <p className="text-gray-600">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
          <Button 
            onClick={handleCreateUser} 
            className="flex items-center space-x-2 bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Lista de Usuarios</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar usuarios por nombre, usuario o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600 font-medium">Usuario</TableHead>
                <TableHead className="text-gray-600 font-medium">Nombre</TableHead>
                <TableHead className="text-gray-600 font-medium">Rol</TableHead>
                <TableHead className="text-gray-600 font-medium">Estado</TableHead>
                <TableHead className="text-gray-600 font-medium">Fecha Creación</TableHead>
                <TableHead className="text-right text-gray-600 font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{user.username}</TableCell>
                  <TableCell className="text-gray-700">{user.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge 
                        variant={getRoleBadgeVariant(user.role.name)}
                        className="text-xs"
                      >
                        {getRoleDisplayName(user.role.name)}
                      </Badge>
                      {user.role.name === 'especialista' && user.specialty && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium text-[#2E9589]">
                            {user.specialty.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.isActive ? "default" : "secondary"}
                      className={`text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => handleEditUser(user)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangePassword(user)}
                          className="cursor-pointer"
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Cambiar Contraseña
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleUserStatus(user)}
                          className="cursor-pointer"
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 cursor-pointer focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No se encontraron usuarios</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay usuarios registrados en el sistema'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Usuario */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Modal de Contraseña */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={selectedUser}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              usuario &quot;{userToDelete?.name}&quot; y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
