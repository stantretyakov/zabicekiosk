import React, { useState, useRef, useEffect } from "react";
import { createPass, listPasses, getClientToken } from "../lib/api";
import QRCodeStyling from "qr-code-styling";
import styles from "./ClientForm.module.css";

function normPhone(v: string): string {
  return v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

interface Pass {
  id: string;
  type: string;
  remaining: number;
  total: number;
}

interface ClientFormProps {
  onClose: () => void;
  onSave: (client: any) => void;
  client?: any;
}

export default function ClientForm({ onClose, onSave, client }: ClientFormProps) {
  const [formData, setFormData] = useState({
    firstName: client?.firstName || "",
    lastName: client?.lastName || "",
    email: client?.email || "",
    phone: client?.phone || "",
    isActive: client?.isActive ?? true,
  });
  
  const [passes, setPasses] = useState<Pass[]>([]);
  const [newPassType, setNewPassType] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (client?.id) {
      loadPasses();
      loadClientToken();
    }
  }, [client?.id]);

  const loadPasses = async () => {
    if (!client?.id) return;
    try {
        const data = await listPasses({ clientId: client.id });
        setPasses(
          data.items.map(({ planSize, ...p }) => ({
            id: p.id,
            type: p.type,
            remaining: p.remaining,
            total: planSize,
          }))
        );
    } catch (error) {
      console.error("Failed to load passes:", error);
    }
  };

  const loadClientToken = async () => {
    if (!client?.id) return;
    try {
        const { token } = await getClientToken(client.id);

        if (qrRef.current) {
          qrRef.current.innerHTML = "";
          const qrCodeStyling = new QRCodeStyling({
            width: 200,
            height: 200,
            data: token,
            dotsOptions: {
              color: "#2be090",
              type: "rounded",
            },
            backgroundOptions: {
              color: "#1a1a1a",
            },
            cornersSquareOptions: {
              color: "#2be090",
              type: "extra-rounded",
            },
            cornersDotOptions: {
              color: "#2be090",
              type: "dot",
            },
          });
          qrCodeStyling.append(qrRef.current);
        }
    } catch (error) {
      console.error("Failed to load client token:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPass = async () => {
    if (!client?.id) return;

    try {
      await createPass({
        clientId: client.id,
        planSize: parseInt(newPassType),
        purchasedAt: new Date().toISOString(),
      });
      await loadPasses();
    } catch (error) {
      console.error("Failed to add pass:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "phone") {
      setFormData(prev => ({
        ...prev,
        [name]: normPhone(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalBody}>
        <h2 className={styles.modalTitle}>
          {client ? "Edit Client" : "Add New Client"}
        </h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter first name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter last name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="(555) 123-4567"
                required
              />
            </div>
            
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom}></span>
                Active Client
              </label>
            </div>
          </div>

          {client?.id && (
            <>
              <div className={styles.clientQrSection}>
                <h3 className={styles.sectionTitle}>Client QR Code</h3>
                <div ref={qrRef} className={styles.qrContainer}></div>
              </div>

              <div className={styles.passesSection}>
                <h3 className={styles.sectionTitle}>Passes</h3>
                
                {passes.length > 0 ? (
                  <div className={styles.passesList}>
                    {passes.map((pass) => (
                      <div key={pass.id} className={styles.passItem}>
                        <div className={styles.passInfo}>
                          <span className={styles.passRemaining}>{pass.remaining}</span>
                          <span className={styles.passSeparator}>/</span>
                          <span className={styles.passTotal}>{pass.total}</span>
                        </div>
                        <div className={styles.passType}>{pass.type} Pass</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noPasses}>
                    <span className={styles.noPassesIcon}>🎫</span>
                    No passes found
                  </div>
                )}
                
                <div className={styles.addPassForm}>
                  <select
                    value={newPassType}
                    onChange={(e) => setNewPassType(e.target.value)}
                    className={styles.passSelect}
                  >
                    <option value="5">5 Pass</option>
                    <option value="10">10 Pass</option>
                    <option value="20">20 Pass</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPass}
                    className={styles.btnAddPass}
                  >
                    Add Pass
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isLoading}
            >
              {isLoading && <div className={styles.spinner}></div>}
              {client ? "Update Client" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}