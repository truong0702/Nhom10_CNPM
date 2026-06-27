import { Carrier, Vehicle } from '../models/index.js';

const requireOwnedCarrier = async (req, res) => {
  const carrier = await Carrier.findOne({ where: { ownerUserId: req.user.id } });
  if (!carrier) {
    res.status(404).json({ error: 'Carrier profile not found for this account' });
    return null;
  }
  return carrier;
};

export const createVehicle = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { plateNumber, type, driverName } = req.body;
    if (!plateNumber) {
      return res.status(400).json({ error: 'Plate number is required' });
    }
    if (type && !['sleeping', 'seating'].includes(type)) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }

    const exists = await Vehicle.findOne({ where: { plateNumber } });
    if (exists) {
      return res.status(400).json({ error: 'Vehicle with this plate number already exists' });
    }

    const vehicle = await Vehicle.create({
      carrierId: carrier.id,
      plateNumber: plateNumber.trim(),
      type: type || 'seating',
      driverName: driverName ? driverName.trim() : null,
      status: 'active',
    });

    return res.status(201).json({ vehicle });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { id } = req.params;
    const { plateNumber, type, driverName, status } = req.body;

    const vehicle = await Vehicle.findOne({ where: { id, carrierId: carrier.id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (type && !['sleeping', 'seating'].includes(type)) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid vehicle status' });
    }

    if (plateNumber && plateNumber.trim() !== vehicle.plateNumber) {
      const exists = await Vehicle.findOne({ where: { plateNumber: plateNumber.trim() } });
      if (exists) {
        return res.status(400).json({ error: 'Vehicle with this plate number already exists' });
      }
      vehicle.plateNumber = plateNumber.trim();
    }

    if (type) vehicle.type = type;
    if (driverName !== undefined) vehicle.driverName = driverName ? driverName.trim() : null;
    if (status) vehicle.status = status;

    await vehicle.save();
    return res.json({ vehicle });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const { id } = req.params;
    const vehicle = await Vehicle.findOne({ where: { id, carrierId: carrier.id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await vehicle.destroy();
    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getCarrierVehicles = async (req, res) => {
  try {
    const carrier = await requireOwnedCarrier(req, res);
    if (!carrier) return;

    const vehicles = await Vehicle.findAll({
      where: { carrierId: carrier.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json({ vehicles });
  } catch (error) {
    console.error('Get carrier vehicles error:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getVehicleCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'sleeping', name: 'Xe giường nằm' },
      { id: 'seating', name: 'Xe ghế ngồi' },
    ];
    return res.json({ categories });
  } catch (error) {
    console.error('Get vehicle categories error:', error);
    return res.status(500).json({ error: error.message });
  }
};
